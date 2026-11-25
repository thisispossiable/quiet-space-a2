# Assignment 2: Project Report

**Main report word count: approximately 1,075 words**  
**Abstract word count: 244 words**  
**Combined report word count: approximately 1,319 words**

## Abstract

Quiet Space is a browser-based, low-risk wellbeing prototype that helps a user name an emotional state, record a stress level and choose a small supportive action. The project addresses a practical problem identified in everyday student life: stress can become difficult to manage when a person has limited time, too many options or no private way to pause and reflect. The prototype provides a calm interface, a stress scale, a short text channel, rule-based wellbeing suggestions, a breathing or rest timer and a fixed safety response. It does not diagnose mental illness or represent itself as a medical service.

The current scope is deliberately narrow. Users can select one of five feelings, enter a stress score from 1 to 10, type a short message and select breathing, rest or task breakdown. JavaScript compares these inputs against visible rules and generates one of three kinds of response: ordinary low-risk guidance, higher-stress guidance or emergency-oriented support. Emotion and stress choices are stored only in browser `localStorage`, with an explicit **Clear this session** control.

The system is a prototype rather than a clinical product. Interfaces and control flow are implemented, while user evaluation and verified referral data remain planned. The system diagram identifies both simulated intelligence and implemented components. Storyboards demonstrate moderate stress, high stress and a safety-phrase scenario. The development record also explains major scope decisions and the review of AI-assisted implementation. The project therefore supports an accountable demonstration of intelligent interaction while preserving clear limits.

## Design Rationale and Project Explanation

The central design decision was to separate the project from a general-purpose conversational assistant. A wellbeing setting introduces risks if the system speaks as though it knows a user's diagnosis or can provide urgent care. Quiet Space therefore uses an explicit rule engine instead of unrestricted generated advice. The system considers the emotion, stress level, selected action and a short list of safety phrases, then returns an understandable response. This approach demonstrates intelligent behaviour without falsely suggesting clinical reasoning or an extensive model.

The first design principle was *human-centred problem framing*. The problem is not simply a lack of information about wellbeing. It is that a person under stress may need a small, immediate next step and an interface that makes choices manageable. The emotion buttons reduce the effort of describing a feeling, and the 1–10 scale adds more information to the response. The text box remains optional, allowing a user to give context without forcing disclosure. This hierarchy is intended to support agency rather than demand disclosure.

The choices of *visibility* and *feedback* follow the Week 1–4 concept of system feedback. The selected emotion and preferred action are highlighted; the stress slider updates immediately; sending a message produces an assistant message; and the timer visibly counts down. Feedback is deliberately local and reversible. Users can change a state, try another action or clear the session. These controls demonstrate that the system is an interactive tool rather than a one-way set of instructions. A user should be able to see what was selected and understand why a response changed.

The rule structure was evidence-led by a simple state mapping. Low stress and calm state receive maintenance suggestions. Moderate stress receives a breathing, walking or planning suggestion. High stress receives a smaller action and a reminder to seek support if difficulties persist. These distinctions are not claimed as medical thresholds. They act as a transparent demonstration of contextual adaptation. Each condition uses a small number of understandable variables, supporting explanation and testing. If more detailed assessment were introduced later, it would require clinical review and would not be passed as currently implemented.

The *safety boundary* is the most important design requirement. The user can enter a direct crisis phrase, such as “I want to die.” The safety check runs before ordinary stress rules and replaces the normal response with emergency-oriented advice: contact local emergency services or a crisis service and involve a trusted person. The interface remains labelled as a non-diagnostic prototype. This choice prioritises harm prevention over conversational continuity and makes it explicit that a deterministic phrase check has significant limitations.

A short exercise card provides *direct manipulation and control*. It offers one of the selected actions and a timer. Breathing remains an option rather than an instruction: users can choose an alternative or stop. The three-minute duration is short enough to remain relevant to a student break. It is presented as a voluntary exercise, not evidence of treatment.

The visual design uses a limited green palette, generous spacing and low-contrast secondary text to reduce visual pressure. The layout changes from two columns to a single column on small screens. The calm tone is an attempt to reflect the wellbeing context, but the design does not depend on decorative imagery. This was a deliberate trade-off: visual clarity was prioritised over polished production effects because the assignment asks for developed evidence and reasons, not maximum feature count.

The project uses browser-local storage to make the quick check-in usable without an account or server. This supports privacy, but is also a limitation. Data should not be mistaken for permanent clinical records, and browser storage is not encrypted by the application. Clearing the session removes the record and the interface offers no sharing controls. If a future version needs persistence or analysis, informed consent and a privacy design would be required.

## System Diagram

The system diagram shows:

- the implemented interface, including emotion, stress, message and exercise controls;
- the implemented rule engine, including stress and safety checks;
- the response and control layer, including the optional timer;
- browser-local storage, with no server upload;
- the distinction between implemented, simulated and planned behaviour.

The diagram makes one information boundary explicit: the interface sends text only to local JavaScript. It does not send data to a model or external service. The rule engine is therefore the implemented form of “AI behaviour,” while a generative model remains out of scope.

## Storyboards and Illustrated Interaction

**Implemented moderate-stress scenario.** A user selects “Anxious” and sets stress to 6/10. The interface highlights both choices and shows the value in the chat. The rule engine combines the emotion and level, returns a short breathing or walking suggestion, and displays the exercise card when an action is selected. The user may change the action or clear the session.

**Implemented high-stress scenario.** A user selects stress 9/10 and chooses slow breathing. The rule engine gives a short exercise and asks the user to identify one controllable next step. Starting the timer gives count-down feedback. The high-stress response also states that persistent impairment should lead to trusted or professional support.

**Implemented safety scenario.** A user sends a crisis phrase. The safety check runs before ordinary guidance and produces a fixed notice directing the user to emergency or crisis support and a trusted person. The storyboard marks this as a safety boundary. The implementation does not claim that keyword detection is comprehensive or clinically valid.

## Repository and Development Evidence

The repository contains the runnable HTML, CSS and JavaScript files, [this README](./README.md), [the system diagram](./system-diagram.svg) and [the interaction storyboard](./storyboard.svg). The README records project status, technology, running instructions, major changes and AI assistance.

The initial implementation was changed to an English interface after confirming the original English assignment document. A later change corrected the rule values so all English emotion and action choices matched the JavaScript engine. The crisis response was also separated from ordinary suggestions to prevent unsafe conversational fallback. These changes are linked conceptually to the scope and safety rationale above.

Because no source repository or Assignment 1 submission was available when the prototype began, I cannot accurately name or link the original literature or feedback sources here. The report should be updated by the student with the relevant Assignment 1 references and their exact application to the choices. The design links below are therefore general scholarly sources and should be verified against course concepts.

## References

- Norman, D. A. (2013). *The Design of Everyday Things: Revised and Expanded Edition*. Basic Books.
- Nielsen, J. (1994). “Enhancing the explanatory power of usability heuristics.” *Proceedings of ACM CHI '94*.
- Shneiderman, B. (1997). “Direct manipulation for comprehensible, predictable and controllable user interfaces.” *Proceedings of IUI '97*.
- World Health Organization. (2022). *World mental health report: Transforming mental health for all*. WHO.

All visual and code artefacts are original to this project unless a named source is added to the repository. The student remains responsible for checking each claim and for replacing or extending the references with Assignment 1 literature and course feedback.
