from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "supabase" / "functions" / "download-message-pack" / "ApplyGuard-PH-Message-Pack.pdf"

INK = colors.HexColor("#1F211D")
SOFT_INK = colors.HexColor("#5E6259")
PAPER = colors.HexColor("#F7F2E7")
CARD = colors.HexColor("#FFFDF7")
BRAND = colors.HexColor("#0E7C66")
GOLD = colors.HexColor("#E6B94C")
LINE = colors.HexColor("#D8D0C0")
WARN = colors.HexColor("#9A5B1A")


TEMPLATES = [
    (
        "1. Direct application opener",
        "Use when you are emailing or messaging the hiring manager directly.",
        "Hi [Name] - I saw your opening for [Role]. Your need for [specific responsibility] stood out because I have [relevant experience or proof]. I can help with [outcome one] and [outcome two], using [tool or skill]. Here is a relevant example: [portfolio link or one-line result]. If the role is still open, I would be glad to discuss what success should look like in the first 30 days. Best, [Your name]",
    ),
    (
        "2. Short platform application",
        "Use for OnlineJobs.ph, Upwork, or forms with limited space.",
        "Hi - I can help with [main job outcome]. I have [number] years/months of experience with [two relevant skills], including [short proof or result]. I am available [hours and time zone] and can start [date]. One question before we proceed: [most important missing detail]. Portfolio: [link].",
    ),
    (
        "3. Experience-first application",
        "Use when your strongest advantage is a similar project or role.",
        "Hi [Name], I recently handled a similar [project/role] for [type of client]. I [specific action] and achieved [measurable or concrete result]. For your [Role] opening, I would begin by [first useful step]. I am comfortable with [tools named in the post] and can work [schedule]. Would it help if I sent a short sample plan for [their stated problem]?",
    ),
    (
        "4. Career-shifter application",
        "Use when you do not have the exact title but your skills transfer.",
        "Hi [Name], my recent title was [Current/previous title], but the work closely matches your need for [responsibility]. I have already done [transferable task], [transferable task], and [relevant tool]. A useful example is [brief proof]. I am moving into [target role] deliberately, and I would be comfortable completing a short, paid skills check if needed. May I ask what result matters most in the first month?",
    ),
    (
        "5. Referral introduction",
        "Use when someone recommended you or shared the opportunity.",
        "Hi [Name], [Referrer's name] suggested I contact you about the [Role] opening. My background in [skill/industry] seems relevant to your need for [specific outcome]. I recently [short proof]. I have attached/shared [resume or portfolio], and I would be happy to answer a few questions or join a short call. Thank you for considering me.",
    ),
    (
        "6. Portfolio follow-up",
        "Use when the employer asks to see work samples.",
        "Hi [Name], here are the most relevant samples for the [Role]: [Link 1 - what it proves], [Link 2 - what it proves], and [Link 3 - what it proves]. My role in each project was [your actual contribution]. If helpful, I can walk you through the decisions behind [most relevant sample] and how I would adapt that approach to your project.",
    ),
    (
        "7. Ask for missing job details",
        "Use before applying when the post is too vague.",
        "Hi [Name], I am interested in the [Role], but I want to make sure it is a good fit before taking your time. Could you share the expected weekly hours, the main deliverables, the budget or rate range, who the role reports to, and whether this is employee or contractor work? Once I have those details, I can send a focused application.",
    ),
    (
        "8. Verify the company and contact",
        "Use when the company identity or recruiter's connection is unclear.",
        "Hi [Name], before I share personal documents, could you please send the company website, your company email address, the legal/company name on the contract, and a link to the role on an official company page? I verify these details for every remote opportunity. I am happy to continue once I can confirm them.",
    ),
    (
        "9. Clarify rate and payment terms",
        "Use when pay is missing, unclear, or described only as 'up to'.",
        "Hi [Name], could you confirm the guaranteed base rate for this role, the currency, whether it is hourly/monthly/per-project, and the payment schedule? Please also let me know the approved payment method and whether any part is commission-only. My target is [your rate/range] for [scope and hours].",
    ),
    (
        "10. Confirm schedule and time zone",
        "Use when a remote role may require night work or fixed coverage.",
        "Hi [Name], could you confirm the required working hours in [their time zone] and whether the schedule is fixed or flexible? I am available [your hours] Philippine Time, with [number] hours of overlap. I can adjust for planned meetings, but I would like to confirm the regular schedule before moving forward.",
    ),
    (
        "11. Follow up after applying",
        "Send three to five business days after a serious application.",
        "Hi [Name], I am following up on my application for [Role] sent on [date]. The part I am most confident I can help with is [specific outcome]. If the role is still active, I would be glad to answer any questions or share a relevant work sample. Thank you for your time.",
    ),
    (
        "12. Follow up after an interview",
        "Send within 24 hours while the conversation is still fresh.",
        "Hi [Name], thank you for discussing the [Role] today. I appreciated learning about [specific challenge or priority]. Based on our conversation, I would approach it by [one concise idea]. I remain interested and am happy to provide any additional examples. Please let me know the next step and expected timeline.",
    ),
    (
        "13. Follow up after a paid test",
        "Use after submitting a legitimate, scoped paid exercise.",
        "Hi [Name], I submitted the [test/task] on [date] through [method]. My main decisions were [short explanation]. Could you confirm receipt, the review timeline, and the payment date we agreed on? I am available if you would like me to explain any part of the work.",
    ),
    (
        "14. Negotiate a higher rate",
        "Use after the employer shows clear interest and the scope is understood.",
        "Thank you for the offer. Based on the scope - especially [responsibility one] and [responsibility two] - I would be comfortable accepting at [target rate]. That reflects my experience with [relevant proof] and the level of ownership required. If the budget is fixed, we could adjust [hours, deliverables, or scope] to fit. Would [target rate] work?",
    ),
    (
        "15. Counter a low offer with options",
        "Use when you want to preserve the opportunity without accepting poor terms.",
        "Thanks for sharing the budget. I cannot take the full scope at [offered rate], but I can offer two options: (1) [reduced scope] for [offered/adjusted rate], or (2) the complete scope for [target rate]. Both options include [clear deliverable]. Let me know which is closer to what you need.",
    ),
    (
        "16. Decline an unpaid work test",
        "Use when the test creates usable work or takes substantial time.",
        "Thanks for the invitation. I do not complete unpaid production work, but I can do a short paid test with a defined scope, deadline, and fee. Alternatively, I can walk you through an existing sample that demonstrates the same skill. If a paid test works, please send the brief and payment terms.",
    ),
    (
        "17. Refuse upfront fees or equipment payments",
        "Use once, then disengage if they continue asking for money.",
        "I do not pay application, training, software-access, equipment, or release fees to obtain work. A legitimate employer can provide required access directly or document an approved reimbursement process in the contract. I will not send payment. If this is a genuine role, please continue through the company's official hiring process.",
    ),
    (
        "18. Ask for contract and payment protection",
        "Use before starting any work, even for a friendly client.",
        "Before I begin, please send the written agreement covering the legal client/company name, deliverables, deadlines, rate, currency, payment schedule, revision limits, ownership, termination terms, and approved payment method. I will start once both sides have signed and the first milestone/deposit is confirmed.",
    ),
    (
        "19. Set boundaries on availability",
        "Use to prevent an always-online expectation.",
        "I can commit to [hours] per week and respond during [working window] Philippine Time. My normal response time is [time], with planned meetings inside our overlap window. Urgent or weekend coverage is not included unless we agree on it in advance. Does that match the team's expectations?",
    ),
    (
        "20. Decline and close professionally",
        "Use when the role, rate, risk, or schedule is not right.",
        "Thank you for considering me. After reviewing the [scope/rate/schedule], I do not think this is the right fit, so I will withdraw rather than overcommit. I appreciate your time and wish you well with the search. Please delete any personal documents I shared for this application.",
    ),
]


def page_background(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, A4[0], A4[1], stroke=0, fill=1)
    canvas.setStrokeColor(LINE)
    canvas.line(18 * mm, 15 * mm, A4[0] - 18 * mm, 15 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(SOFT_INK)
    canvas.drawString(18 * mm, 9 * mm, "ApplyGuard PH - Remote Job Message Pack")
    canvas.drawRightString(A4[0] - 18 * mm, 9 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=20 * mm,
        title="ApplyGuard PH Remote Job Message Pack",
        author="ApplyGuard PH",
        subject="20 adaptable templates for Filipino remote job seekers",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="paper", frames=frame, onPage=page_background)])

    styles = getSampleStyleSheet()
    title = ParagraphStyle("TitleAG", parent=styles["Title"], fontName="Times-Bold", fontSize=30, leading=34, textColor=INK, alignment=TA_CENTER, spaceAfter=8 * mm)
    subtitle = ParagraphStyle("SubtitleAG", parent=styles["BodyText"], fontName="Helvetica", fontSize=12, leading=18, textColor=SOFT_INK, alignment=TA_CENTER, spaceAfter=7 * mm)
    heading = ParagraphStyle("HeadingAG", parent=styles["Heading2"], fontName="Times-Bold", fontSize=17, leading=21, textColor=INK, spaceBefore=3 * mm, spaceAfter=2 * mm)
    body = ParagraphStyle("BodyAG", parent=styles["BodyText"], fontName="Helvetica", fontSize=10, leading=15, textColor=INK, spaceAfter=2 * mm)
    note = ParagraphStyle("NoteAG", parent=body, fontSize=9, leading=13, textColor=SOFT_INK)
    label = ParagraphStyle("LabelAG", parent=body, fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=BRAND, spaceAfter=1 * mm)
    message = ParagraphStyle("MessageAG", parent=body, fontSize=10, leading=15, leftIndent=5 * mm, rightIndent=5 * mm, borderColor=LINE, borderWidth=0.7, borderPadding=5 * mm, backColor=CARD, spaceAfter=4 * mm)

    story = [
        Spacer(1, 18 * mm),
        Paragraph("REMOTE JOB<br/>MESSAGE PACK", title),
        Paragraph("20 adaptable templates for Filipino remote job seekers", subtitle),
        Paragraph("Apply faster. Ask sharper questions. Protect your rate and your identity.", ParagraphStyle("Tag", parent=subtitle, textColor=BRAND, fontName="Helvetica-Bold")),
        Spacer(1, 12 * mm),
        Paragraph("How to use this pack", heading),
        Paragraph("Replace every [bracketed placeholder] with truthful details. Remove lines that do not apply. Add one specific detail from the job post so your message sounds written for that employer, not copied for everyone.", body),
        Paragraph("Safety rule", label),
        Paragraph("Never send money, passwords, one-time codes, banking access, or high-resolution identity documents just to apply. Verify the company through an official domain and insist on written payment terms before starting work.", message),
        Paragraph("A template gets you started. Your real proof - relevant work, clear availability, and honest results - is what gets replies.", note),
        Spacer(1, 8 * mm),
    ]

    for title_text, use_text, message_text in TEMPLATES:
        story.append(KeepTogether([
            Paragraph(title_text, heading),
            Paragraph(use_text, note),
            Spacer(1, 1.5 * mm),
            Paragraph("COPY, PERSONALIZE, SEND", label),
            Paragraph(message_text, message),
        ]))

    story.extend([
        Spacer(1, 5 * mm),
        Paragraph("Final pre-send check", heading),
        Paragraph("1. Did I use the correct name and role? 2. Did I include one relevant proof? 3. Did I remove every unused placeholder? 4. Did I avoid invented experience? 5. Did I verify the company before sharing sensitive information?", message),
        Paragraph("ApplyGuard PH gives a second opinion, not a guarantee. Keep records of job posts, messages, agreements, and payment receipts.", note),
    ])

    doc.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    build_pdf()
