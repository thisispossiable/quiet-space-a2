import json
import threading
import unittest
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from xml.etree import ElementTree

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


class PrototypeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        handler = partial(QuietHandler, directory=str(ROOT))
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base_url = f"http://127.0.0.1:{cls.server.server_port}"
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(channel="msedge", headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def setUp(self):
        self.context = self.browser.new_context(viewport={"width": 1440, "height": 1050})
        self.page = self.context.new_page()
        self.page.set_default_timeout(5000)
        self.errors = []
        self.external_requests = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.on(
            "request",
            lambda request: self.external_requests.append(request.url)
            if not request.url.startswith(self.base_url)
            else None,
        )
        self.page.goto(self.base_url, wait_until="networkidle")

    def tearDown(self):
        self.assertEqual(self.errors, [], "Browser JavaScript errors")
        self.assertEqual(self.external_requests, [], "Unexpected external requests")
        self.context.close()

    def evaluate_scenario(self, scenario="phishing", policy="protective"):
        self.page.locator(f'[data-scenario="{scenario}"]').click()
        self.page.get_by_label("Decision policy").select_option(policy)
        self.page.get_by_role("button", name="Evaluate simulated page").click()

    def test_protective_block_explains_decision_without_bypass(self):
        for scenario in ("phishing", "malware", "uncertain"):
            with self.subTest(scenario=scenario):
                self.evaluate_scenario(scenario)
                self.assertEqual(self.page.locator("#decisionTitle").inner_text(), "Page blocked by default")
                self.assertEqual(self.page.get_by_role("button", name="Continue in simulation").count(), 0)
                self.page.get_by_text("Why this decision?").click()
                self.assertIn("Fixture rule P1", self.page.locator("#ruleExplanation").inner_text())
                self.assertNotEqual(self.page.locator("#evidenceList").inner_text(), "")

    def test_guided_choice_continues_only_to_an_internal_preview(self):
        for scenario in ("phishing", "malware", "uncertain"):
            with self.subTest(scenario=scenario):
                self.evaluate_scenario(scenario, "guided")
                self.page.get_by_role("button", name="Continue in simulation").click()
                self.assertTrue(self.page.locator("#preview").is_visible())
                self.assertEqual(self.page.url, self.base_url + "/")
                self.assertIn("No real website", self.page.locator("#preview").inner_text())
                self.page.get_by_role("button", name="Request a review").click()
                self.assertFalse(self.page.locator("#preview").is_visible())
                self.assertEqual(self.page.get_by_role("button", name="Continue in simulation").count(), 0)

    def test_false_positive_review_is_pending_before_scripted_correction(self):
        self.evaluate_scenario("uncertain")
        self.page.get_by_role("button", name="Request a review").click()
        self.assertIn("Review requested", self.page.locator("#reviewStatus").inner_text())
        self.assertFalse(self.page.locator("#preview").is_visible())
        self.page.get_by_role("button", name="Run scripted review").click()
        self.assertIn("False positive corrected", self.page.locator("#reviewStatus").inner_text())
        self.assertEqual(self.page.locator("#decisionTitle").inner_text(), "Review cleared this fixture")
        self.page.get_by_role("button", name="Open reviewed simulation").click()
        self.assertTrue(self.page.locator("#preview").is_visible())

    def test_guided_review_explanation_names_the_guided_rule(self):
        self.evaluate_scenario("uncertain", "guided")
        self.page.get_by_role("button", name="Request a review").click()
        self.page.get_by_role("button", name="Run scripted review").click()
        self.assertIn("original warning", self.page.locator("#decisionSummary").inner_text())
        self.page.get_by_text("Why this decision?").click()
        explanation = self.page.locator("#ruleExplanation").inner_text()
        self.assertIn("G1", explanation)
        self.assertNotIn("P1", explanation)

    def test_malware_review_upholds_block(self):
        self.evaluate_scenario("malware")
        self.page.get_by_role("button", name="Request a review").click()
        self.page.get_by_role("button", name="Run scripted review").click()
        self.assertIn("Block upheld", self.page.locator("#reviewStatus").inner_text())
        self.assertEqual(self.page.get_by_role("button", name="Open reviewed simulation").count(), 0)
        self.assertFalse(self.page.locator("#preview").is_visible())

    def test_benign_fixture_does_not_show_a_warning(self):
        for policy in ("protective", "guided"):
            with self.subTest(policy=policy):
                self.evaluate_scenario("benign", policy)
                self.assertEqual(self.page.locator("#decisionTitle").inner_text(), "No warning in this fixture")
                self.page.get_by_role("button", name="Open simulated page").click()
                self.assertTrue(self.page.locator("#preview").is_visible())

    def test_optional_understanding_check_explains_wrong_and_right_answers(self):
        self.evaluate_scenario()
        self.page.get_by_label("It proves the visitor was careless.").check()
        self.page.get_by_role("button", name="Check understanding").click()
        self.assertIn("Not quite", self.page.locator("#understandingFeedback").inner_text())
        self.page.get_by_label("A fixture rule flagged a risk; this is not proof of harm.").check()
        self.page.get_by_role("button", name="Check understanding").click()
        self.assertIn("Correct", self.page.locator("#understandingFeedback").inner_text())
        self.page.get_by_role("button", name="Return to safety").click()
        self.assertIn("Returned to safety", self.page.locator("#decisionTitle").inner_text())

    def test_changed_scenario_clears_previous_decision_and_review(self):
        self.evaluate_scenario("uncertain")
        self.page.get_by_role("button", name="Request a review").click()
        self.page.locator('[data-scenario="benign"]').click()
        self.assertTrue(self.page.locator("#decisionPanel").is_hidden())
        self.assertTrue(self.page.locator("#reviewPanel").is_hidden())
        self.assertFalse(self.page.locator("#preview").is_visible())
        self.page.get_by_role("button", name="Evaluate simulated page").click()
        self.assertIn("No warning", self.page.locator("#decisionTitle").inner_text())
        self.page.get_by_label("Decision policy").select_option("guided")
        self.assertTrue(self.page.locator("#decisionPanel").is_hidden())
        self.assertTrue(self.page.locator("#reviewPanel").is_hidden())

    def test_session_trace_exports_and_reset_removes_state(self):
        self.evaluate_scenario()
        self.page.get_by_role("button", name="Return to safety").click()
        with self.page.expect_download() as download_info:
            self.page.get_by_role("button", name="Export local trace").click()
        trace = json.loads(Path(download_info.value.path()).read_text(encoding="utf-8"))
        self.assertTrue(trace["simulation"])
        self.assertTrue(any(event["action"] == "return-to-safety" for event in trace["events"]))
        self.page.get_by_role("button", name="Reset demonstration").click()
        self.assertEqual(self.page.locator("#eventList li").count(), 0)
        self.assertTrue(self.page.locator("#decisionPanel").is_hidden())
        self.assertEqual(self.page.evaluate("localStorage.length"), 0)
        self.assertEqual(self.page.evaluate("sessionStorage.length"), 0)
        self.page.reload()
        self.assertEqual(self.page.locator("#eventList li").count(), 0)

    def test_keyboard_can_reach_and_operate_scenarios(self):
        self.page.get_by_role("link", name="Skip to simulation").focus()
        self.page.keyboard.press("Enter")
        self.page.locator('[data-scenario="phishing"]').focus()
        self.page.keyboard.press("Tab")
        self.page.keyboard.press("Enter")
        self.assertEqual(
            self.page.locator('[data-scenario="malware"]').get_attribute("aria-pressed"), "true"
        )
        self.assertIn("download", self.page.locator("#simulatedUrl").inner_text())

    def test_mobile_layout_has_no_horizontal_overflow(self):
        for width in (390, 320):
            with self.subTest(width=width):
                self.page.set_viewport_size({"width": width, "height": 844})
                self.evaluate_scenario("uncertain")
                self.page.get_by_role("button", name="Request a review").click()
                self.assertLessEqual(
                    self.page.evaluate("document.documentElement.scrollWidth"), width
                )
                self.assertTrue(self.page.get_by_role("button", name="Return to safety").is_visible())

    def test_capture_three_scenarios_and_mobile_evidence(self):
        output = ROOT / "evidence"
        output.mkdir(exist_ok=True)
        self.evaluate_scenario("phishing", "guided")
        self.page.get_by_text("Why this decision?").click()
        self.page.screenshot(path=str(output / "01-guided-warning.png"), full_page=True)
        self.evaluate_scenario("malware")
        self.page.screenshot(path=str(output / "02-protective-block.png"), full_page=True)
        self.evaluate_scenario("uncertain")
        self.page.get_by_role("button", name="Request a review").click()
        self.page.get_by_role("button", name="Run scripted review").click()
        self.page.screenshot(path=str(output / "03-reviewed-false-positive.png"), full_page=True)
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.page.screenshot(path=str(output / "04-mobile-review.png"), full_page=True)


class DiagramTests(unittest.TestCase):
    def test_diagrams_are_well_formed_svg(self):
        for name in ("system-diagram.svg", "storyboard.svg"):
            with self.subTest(name=name):
                root = ElementTree.parse(ROOT / name).getroot()
                self.assertEqual(root.tag, "{http://www.w3.org/2000/svg}svg")


if __name__ == "__main__":
    unittest.main(verbosity=2)
