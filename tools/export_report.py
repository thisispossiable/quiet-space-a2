import html
import re
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]


def word_count(text):
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    text = re.sub(r"^!\[.*\]\(.*\)\s*$", "", text, flags=re.M)
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    text = re.sub(r"^#+\s*", "", text, flags=re.M)
    return len(text.replace("**", "").replace("`", "").split())


def inline_html(text):
    text = html.escape(text)
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", text)
    return re.sub(r"`([^`]+)`", r"<code>\1</code>", text)


def add_word_paragraph(document, text, style=None):
    paragraph = document.add_paragraph(style=style)
    for token in re.split(r"(\*\*.*?\*\*|\[[^\]]+\]\([^)]+\)|\*[^*]+\*|`[^`]+`)", text):
        if token.startswith("**") and token.endswith("**"):
            paragraph.add_run(token[2:-2]).bold = True
        elif token.startswith("*") and token.endswith("*"):
            paragraph.add_run(token[1:-1]).italic = True
        elif token.startswith("["):
            match = re.fullmatch(r"\[([^\]]+)\]\(([^)]+)\)", token)
            paragraph.add_run(f"{match[1]} ({match[2]})")
        else:
            paragraph.add_run(token.strip("`"))
    return paragraph


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


def export():
    source = (ROOT / "PROJECT_REPORT.md").read_text(encoding="utf-8")
    abstract = source.split("## Abstract\n", 1)[1].split("## 1.", 1)[0]
    main = "## 1." + source.split("## 1.", 1)[1].split("## References", 1)[0]
    counts = (word_count(abstract), word_count(main))
    expected = f"**Abstract: {counts[0]} words | Main report: {counts[1]} words | Combined: {sum(counts)} words**"
    if expected not in source:
        raise ValueError(f"Update report word-count label to: {expected}")
    if counts[0] > 300 or counts[1] > 1100 or sum(counts) > 1400:
        raise ValueError(f"Report exceeds assignment limits: {counts}")

    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    readme_body = "\n".join(
        line for line in readme.splitlines() if not line.startswith("Prose word count:")
    )
    readme_count = word_count(readme_body)
    if f"Prose word count: {readme_count} " not in readme:
        raise ValueError(f"Update README prose word count to {readme_count}")

    handler = partial(QuietHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base_url = f"http://127.0.0.1:{server.server_port}"
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(channel="msedge", headless=True)
            try:
                page = browser.new_page(viewport={"width": 1240, "height": 900}, device_scale_factor=2)
                for name in ("system-diagram", "storyboard"):
                    page.goto(f"{base_url}/{name}.svg", wait_until="networkidle")
                    page.locator("svg").screenshot(path=str(ROOT / "evidence" / f"{name}.png"))

                document = Document()
                section = document.sections[0]
                section.top_margin = Inches(0.7)
                section.bottom_margin = Inches(0.7)
                section.left_margin = Inches(0.75)
                section.right_margin = Inches(0.75)
                normal = document.styles["Normal"]
                normal.font.name = "Calibri"
                normal.font.size = Pt(11)
                normal.font.color.rgb = RGBColor.from_string("23332D")
                normal.paragraph_format.space_after = Pt(8)
                normal.paragraph_format.line_spacing = 1.12
                fragments = []
                in_references = False
                for block in source.split("\n\n"):
                    block = block.strip()
                    if not block:
                        continue
                    if block == "## References":
                        in_references = True
                    image = re.fullmatch(r"!\[([^\]]+)\]\(([^)]+)\)", block)
                    if image:
                        caption, path = image.groups()
                        fragments.append(
                            f'<figure><img src="{html.escape(path)}" alt="{html.escape(caption)}" />'
                            f"<figcaption>{html.escape(caption)}</figcaption></figure>"
                        )
                        document.add_picture(str(ROOT / Path(path)), width=Inches(6.7))
                        document.add_paragraph(caption, style="Caption")
                    elif block.startswith("# "):
                        title = block[2:]
                        fragments.append(f"<h1>{inline_html(title)}</h1>")
                        document.add_heading(title, 0)
                    elif block.startswith("## "):
                        heading = block[3:]
                        identifier = ' id="references"' if in_references else ""
                        fragments.append(f"<h2{identifier}>{inline_html(heading)}</h2>")
                        document.add_heading(heading, 1)
                    else:
                        fragments.append(f"<p>{inline_html(block)}</p>")
                        add_word_paragraph(document, block)
                document.core_properties.title = "SafeBrowse: Who Carries the Risk?"
                document.core_properties.subject = "Assignment 2: Project Report"
                document.core_properties.author = ""
                document.save(ROOT / "SafeBrowse-A2-Report.docx")

                rendered = """<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>SafeBrowse | Assignment 2 report</title><link rel="icon" href="data:," />
<style>
body{font-family:"Segoe UI",Arial,sans-serif;color:#23332d;background:#f5f4ee;line-height:1.65;margin:0}
main{max-width:820px;margin:40px auto;background:#fff;padding:44px 48px;border:1px solid #dedfd5}
h1{font-size:2.1rem;line-height:1.15;letter-spacing:-.03em}h2{font-size:1.2rem;margin-top:30px}
a{color:#214e3b;overflow-wrap:anywhere}p{font-size:14px}
figure{margin:24px 0;break-inside:avoid}figure img{width:100%;height:auto;display:block}
figcaption{font-size:11px;color:#52634c;margin-top:7px}code{background:#f0f3eb}
.toolbar{max-width:820px;margin:20px auto;font-size:13px}
@media(max-width:700px){main{margin:12px;padding:24px}.toolbar{margin:18px}}
@media print{body{background:#fff}main{border:0;padding:0;margin:0;max-width:none}.toolbar{display:none}
h1,h2{break-after:avoid}p{font-size:10.5pt;orphans:3;widows:3}figure img{max-height:210mm;object-fit:contain}
@page{size:A4;margin:18mm}}
</style></head><body>
<nav class="toolbar"><a href="index.html">Back to the prototype</a> /
<a href="SafeBrowse-A2-Report.pdf">PDF</a> /
<a href="SafeBrowse-A2-Report.docx">Word</a></nav><main>
""" + "\n".join(fragments) + "</main></body></html>"
                (ROOT / "report.html").write_text(rendered, encoding="utf-8")
                page.goto(f"{base_url}/report.html", wait_until="networkidle")
                page.pdf(
                    path=str(ROOT / "SafeBrowse-A2-Report.pdf"),
                    format="A4",
                    print_background=True,
                    display_header_footer=True,
                    header_template="<span></span>",
                    footer_template='<div style="font-size:8px;width:100%;text-align:center;color:#64705e">SafeBrowse / A2 &nbsp; <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
                    margin={"top": "18mm", "bottom": "18mm", "left": "18mm", "right": "18mm"},
                )
                missing = page.locator("img").evaluate_all(
                    "(images) => images.filter(image => !image.complete || image.naturalWidth === 0).length"
                )
                if missing:
                    raise RuntimeError(f"Report contains {missing} missing images")
                print(f"Report exported: abstract={counts[0]}, main={counts[1]}, total={sum(counts)}, README={readme_count}")
                print("Created report.html, SafeBrowse-A2-Report.docx and SafeBrowse-A2-Report.pdf")
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


if __name__ == "__main__":
    export()
