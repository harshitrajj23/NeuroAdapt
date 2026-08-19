"""
NeuroAdapt Clinical PDF Report Generator (PRD Section 14).
Generates an official, evidence-informed PDF clinical progress report for pediatric patients.
"""

import io
from datetime import datetime
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)

def build_clinical_report_pdf(
    patient_data: Dict[str, Any],
    ai_insights: Dict[str, Any],
    domain_stats: Dict[str, Any],
    recent_sessions: List[Dict[str, Any]],
    therapy_plan: Dict[str, Any],
) -> bytes:
    """
    Constructs a styled multi-section Clinical PDF Report using ReportLab.
    Returns the binary PDF bytes for HTTP streaming.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#5B21B6")  # Deep Purple
    secondary_color = colors.HexColor("#7C3AED")  # Violet
    dark_text = colors.HexColor("#1E1B4B")
    muted_text = colors.HexColor("#64748B")
    card_bg = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#E2E8F0")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=primary_color,
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=13,
        textColor=muted_text,
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=primary_color,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=dark_text,
    )
    body_bold = ParagraphStyle(
        "BodyBold",
        parent=body_style,
        fontName="Helvetica-Bold",
    )
    bullet_style = ParagraphStyle(
        "BulletText",
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-12,
        spaceAfter=4,
    )
    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        leading=10,
        textColor=muted_text,
    )

    story = []

    # ══════════════════════════════════════════════════════════════════════
    # 1. HEADER & BRANDING
    # ══════════════════════════════════════════════════════════════════════
    clinician_display = patient_data.get("clinician_name", "Supervising Clinician")
    if not clinician_display.startswith("Dr."):
        clinician_display = f"Dr. {clinician_display}"

    header_table_data = [
        [
            Paragraph("<b>NeuroAdapt™</b> Cognitive Retraining Platform", title_style),
            Paragraph(f"<b>Report ID:</b> #NAR-{patient_data.get('id', 1)}-{datetime.utcnow().strftime('%Y%m%d')}<br/><b>Generated:</b> {datetime.utcnow().strftime('%d %b %Y, %H:%M UTC')}", subtitle_style),
        ],
        [
            Paragraph("Computerized Pediatric Cognitive Rehabilitation Progress Report", subtitle_style),
            Paragraph(f"<b>Supervising Clinician:</b> {clinician_display}", subtitle_style),
        ]
    ]
    header_table = Table(header_table_data, colWidths=[330, 202])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=secondary_color, spaceBefore=4, spaceAfter=12))

    # ══════════════════════════════════════════════════════════════════════
    # 2. PATIENT DEMOGRAPHIC & CLINICAL PROFILE
    # ══════════════════════════════════════════════════════════════════════
    story.append(Paragraph("1. PATIENT DEMOGRAPHIC & CLINICAL PROFILE", heading_style))

    stats = patient_data.get("stats", {})
    demo_data = [
        [
            Paragraph("<b>Patient Name:</b>", body_style),
            Paragraph(str(patient_data.get("name", "Patient")), body_style),
            Paragraph("<b>Chronological Age:</b>", body_style),
            Paragraph(f"{patient_data.get('age', 9)} years old", body_style),
        ],
        [
            Paragraph("<b>Diagnosis/Condition:</b>", body_style),
            Paragraph(str(patient_data.get("condition", "ADHD & Cognitive Rehabilitation")), body_style),
            Paragraph("<b>Baseline Intake Score:</b>", body_style),
            Paragraph(f"{patient_data.get('baseline_score', 72)} / 100", body_style),
        ],
        [
            Paragraph("<b>Total Sessions Logged:</b>", body_style),
            Paragraph(f"{stats.get('total_sessions', 0)} sessions", body_style),
            Paragraph("<b>Mean Overall Accuracy:</b>", body_style),
            Paragraph(f"<b>{stats.get('avg_accuracy', 0)}%</b>", body_style),
        ],
        [
            Paragraph("<b>Total XP / Engagement:</b>", body_style),
            Paragraph(f"{stats.get('total_xp', 0)} XP", body_style),
            Paragraph("<b>Mean Response Latency:</b>", body_style),
            Paragraph(f"{stats.get('avg_rt_sec', 2.48)}s (active tasks)", body_style),
        ],
    ]
    demo_table = Table(demo_data, colWidths=[130, 136, 135, 131])
    demo_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), card_bg),
        ("BOX", (0, 0), (-1, -1), 1, border_color),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(demo_table)
    story.append(Spacer(1, 12))

    # ══════════════════════════════════════════════════════════════════════
    # 3. AI CLINICAL DECISION SUPPORT & EXECUTIVE TRAJECTORY
    # ══════════════════════════════════════════════════════════════════════
    story.append(Paragraph("2. AI CLINICAL DECISION SUPPORT & TRAJECTORY ANALYSIS", heading_style))

    summary_p = Paragraph(f"<b>Executive Clinical Overview:</b><br/>{ai_insights.get('summary', 'Telemetry analysis in progress.')}", body_style)
    story.append(summary_p)
    story.append(Spacer(1, 8))

    # Strengths and Areas of Focus side-by-side or stacked
    strengths = ai_insights.get("cognitive_strengths", [])
    struggles = ai_insights.get("areas_requiring_focus", [])

    insights_rows = []
    if strengths:
        s_text = "<b>Demonstrated Cognitive Strengths:</b><br/>" + "<br/>".join([f"• {s}" for s in strengths])
        insights_rows.append([Paragraph(s_text, body_style)])
    if struggles:
        st_text = "<b>Target Areas Requiring Clinical Reinforcement:</b><br/>" + "<br/>".join([f"• {st}" for st in struggles])
        insights_rows.append([Paragraph(st_text, body_style)])

    if ai_insights.get("fatigue_analysis"):
        f_text = f"<b>Cognitive Fatigue & Response Stability:</b><br/>{ai_insights.get('fatigue_analysis')}"
        insights_rows.append([Paragraph(f_text, body_style)])

    if ai_insights.get("difficulty_recommendation"):
        d_text = f"<b>Adaptive Difficulty Recommendation:</b><br/>{ai_insights.get('difficulty_recommendation')}"
        insights_rows.append([Paragraph(d_text, body_style)])

    if insights_rows:
        insights_table = Table(insights_rows, colWidths=[532])
        insights_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F5F3FF")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#DDD6FE")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#EDE9FE")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ]))
        story.append(insights_table)
    story.append(Spacer(1, 12))

    # ══════════════════════════════════════════════════════════════════════
    # 4. 4-DOMAIN NEUROCOGNITIVE PERFORMANCE METRICS
    # ══════════════════════════════════════════════════════════════════════
    story.append(Paragraph("3. 4-DOMAIN NEUROCOGNITIVE TELEMETRY BREAKDOWN", heading_style))

    domain_table_data = [
        [
            Paragraph("<b>Cognitive Domain</b>", body_bold),
            Paragraph("<b>Sessions Completed</b>", body_bold),
            Paragraph("<b>Mean Accuracy</b>", body_bold),
            Paragraph("<b>Avg Latency</b>", body_bold),
            Paragraph("<b>Peak Level</b>", body_bold),
            Paragraph("<b>Clinical Trajectory</b>", body_bold),
        ]
    ]

    domain_names = {
        "attention": "Attention & Vigilance",
        "memory": "Working Memory",
        "reasoning": "Logical Reasoning",
        "problem_solving": "Executive Function",
    }

    for d_key, label in domain_names.items():
        d_info = domain_stats.get(d_key, {})
        acc = d_info.get("avg_accuracy", d_info.get("accuracy", 0))
        sessions_cnt = d_info.get("sessions_count", d_info.get("sessions", 0))
        rt_ms = d_info.get("avg_rt_ms", 0)
        rt_str = f"{round(rt_ms / 1000, 2)}s" if rt_ms > 0 else "—"
        peak_lvl = f"Lvl {d_info.get('max_difficulty', d_info.get('level', 1))}"

        if sessions_cnt == 0:
            status = "Pending Initial Test"
        elif acc >= 80:
            status = "Strong Engagement"
        elif acc >= 60:
            status = "Progressing"
        else:
            status = "Needs Scaffolding"

        domain_table_data.append([
            Paragraph(label, body_style),
            Paragraph(str(sessions_cnt), body_style),
            Paragraph(f"{acc}%", body_style),
            Paragraph(rt_str, body_style),
            Paragraph(peak_lvl, body_style),
            Paragraph(status, body_style),
        ])

    domain_table = Table(domain_table_data, colWidths=[132, 80, 80, 75, 75, 90])
    domain_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EDE9FE")),
        ("TEXTCOLOR", (0, 0), (-1, 0), primary_color),
        ("BOX", (0, 0), (-1, -1), 1, border_color),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(domain_table)
    story.append(Spacer(1, 12))

    # ══════════════════════════════════════════════════════════════════════
    # 5. THERAPY PLAN & PRESCRIBED CORRIDOR
    # ══════════════════════════════════════════════════════════════════════
    story.append(Paragraph("4. ACTIVE THERAPY PLAN & SAFETY CORRIDOR", heading_style))

    target_domains_str = ", ".join(therapy_plan.get("target_domains", ["Attention", "Memory", "Reasoning"]))
    min_diff = therapy_plan.get("min_difficulty", 1)
    max_diff = therapy_plan.get("max_difficulty", 5)
    sched_notes = therapy_plan.get("schedule_notes", "3 home training sessions per week, 15 minutes each.")

    plan_data = [
        [
            Paragraph("<b>Target Cognitive Domains:</b>", body_style),
            Paragraph(target_domains_str, body_style),
        ],
        [
            Paragraph("<b>Adaptive Safety Corridor:</b>", body_style),
            Paragraph(f"Level {min_diff} (Minimum) — Level {max_diff} (Maximum Cap)", body_style),
        ],
        [
            Paragraph("<b>Clinical Schedule & Dosage:</b>", body_style),
            Paragraph(sched_notes, body_style),
        ],
    ]
    plan_table = Table(plan_data, colWidths=[160, 372])
    plan_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), card_bg),
        ("BOX", (0, 0), (-1, -1), 1, border_color),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(plan_table)
    story.append(Spacer(1, 14))

    # ══════════════════════════════════════════════════════════════════════
    # 6. REGULATORY COMPLIANCE & CLINICIAN SIGN-OFF
    # ══════════════════════════════════════════════════════════════════════
    sig_data = [
        [
            Paragraph("<b>Supervising Clinician Verification:</b><br/><br/><br/>________________________________________<br/>" + str(clinician_display) + "<br/>Neurodevelopmental Pediatrics", body_style),
            Paragraph("<b>Clinical Review & Handover Date:</b><br/><br/><br/>________________________________________<br/>" + datetime.utcnow().strftime("%d %B %Y") + "<br/>Hospital / Clinic Protocol Stamp", body_style),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[266, 266])
    sig_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))

    disclaimer_p = Paragraph(
        "<b>CLINICAL REGULATORY NOTICE:</b> This Computerized Cognitive Retraining Telemetry Report "
        "is generated by NeuroAdapt for clinical decision support. All AI insights and recommendations are advisory "
        "and intended to assist the qualified supervising physician. The supervising clinician maintains full therapeutic authority.",
        disclaimer_style
    )

    story.append(KeepTogether([sig_table, Spacer(1, 8), disclaimer_p]))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
