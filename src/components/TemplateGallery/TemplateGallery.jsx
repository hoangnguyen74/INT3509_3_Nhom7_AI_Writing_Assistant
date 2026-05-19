// ========================================
// Template Gallery — Pre-made document templates
// ========================================
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, FileText, Mail, BarChart3, Users, BookOpen, Megaphone, ClipboardList, Lightbulb } from 'lucide-react';
import './TemplateGallery.css';

const TEMPLATES = [
  {
    id: 'email',
    icon: Mail,
    title: 'Professional Email',
    desc: 'Business email with greeting, body, and signature',
    content: `<h2>Subject: [Your Subject Here]</h2>
<p>Dear [Recipient Name],</p>
<p>I hope this email finds you well. I am writing to [purpose of email].</p>
<p>[Main content - explain your points clearly and concisely]</p>
<p>Please let me know if you have any questions or need further clarification.</p>
<p>Best regards,<br/>[Your Name]<br/>[Your Title]<br/>[Your Contact Info]</p>`,
  },
  {
    id: 'report',
    icon: BarChart3,
    title: 'Business Report',
    desc: 'Structured report with sections and findings',
    content: `<h1>Report Title</h1>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}<br/><strong>Prepared by:</strong> [Author Name]</p>
<h2>1. Executive Summary</h2>
<p>[Brief overview of the report's key findings and recommendations]</p>
<h2>2. Background</h2>
<p>[Context and background information relevant to the report]</p>
<h2>3. Findings</h2>
<p>[Detailed findings from your research or analysis]</p>
<h2>4. Recommendations</h2>
<ul><li>[Recommendation 1]</li><li>[Recommendation 2]</li><li>[Recommendation 3]</li></ul>
<h2>5. Conclusion</h2>
<p>[Summary of key points and next steps]</p>`,
  },
  {
    id: 'meeting',
    icon: Users,
    title: 'Meeting Notes',
    desc: 'Organized meeting minutes with action items',
    content: `<h1>Meeting Notes</h1>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}<br/><strong>Attendees:</strong> [Names]<br/><strong>Duration:</strong> [Time]</p>
<h2>📋 Agenda</h2>
<ol><li>[Topic 1]</li><li>[Topic 2]</li><li>[Topic 3]</li></ol>
<h2>📝 Discussion</h2>
<h3>Topic 1</h3>
<p>[Key points discussed]</p>
<h3>Topic 2</h3>
<p>[Key points discussed]</p>
<h2>✅ Action Items</h2>
<ul><li>[ ] [Task] — Assigned to: [Name] — Due: [Date]</li><li>[ ] [Task] — Assigned to: [Name] — Due: [Date]</li></ul>
<h2>📅 Next Meeting</h2>
<p>[Date and time of next meeting]</p>`,
  },
  {
    id: 'blog',
    icon: BookOpen,
    title: 'Blog Post',
    desc: 'Engaging blog article with intro and sections',
    content: `<h1>[Your Blog Post Title — Make It Catchy!]</h1>
<p><em>By [Author Name] • ${new Date().toLocaleDateString()}</em></p>
<p><strong>[Opening hook — Start with a compelling question, statistic, or story that grabs the reader's attention]</strong></p>
<p>[Introduction paragraph — Set the stage for what the reader will learn]</p>
<h2>The Problem</h2>
<p>[Describe the problem or challenge your readers face]</p>
<h2>The Solution</h2>
<p>[Present your main argument or solution with supporting evidence]</p>
<h2>Key Takeaways</h2>
<ul><li>[Takeaway 1]</li><li>[Takeaway 2]</li><li>[Takeaway 3]</li></ul>
<h2>Conclusion</h2>
<p>[Wrap up with a strong call to action or thought-provoking ending]</p>`,
  },
  {
    id: 'pitch',
    icon: Megaphone,
    title: 'Sales Pitch',
    desc: 'Persuasive pitch with value proposition',
    content: `<h1>[Product/Service Name] — [Tagline]</h1>
<h2>🎯 The Problem</h2>
<p>[Describe the pain point your target audience faces. Use specific, relatable examples.]</p>
<h2>💡 Our Solution</h2>
<p>[Explain how your product/service solves this problem. Be specific about features and benefits.]</p>
<h2>📊 Key Benefits</h2>
<ul><li><strong>[Benefit 1]:</strong> [Explanation]</li><li><strong>[Benefit 2]:</strong> [Explanation]</li><li><strong>[Benefit 3]:</strong> [Explanation]</li></ul>
<h2>🏆 Why Us?</h2>
<p>[What makes you different from competitors? Social proof, testimonials, data.]</p>
<h2>📞 Next Steps</h2>
<p>[Clear call to action — schedule a demo, sign up, contact us]</p>`,
  },
  {
    id: 'todo',
    icon: ClipboardList,
    title: 'Project Plan',
    desc: 'Task list with phases and milestones',
    content: `<h1>Project: [Project Name]</h1>
<p><strong>Owner:</strong> [Name] • <strong>Start:</strong> [Date] • <strong>Deadline:</strong> [Date]</p>
<h2>🎯 Objectives</h2>
<ul><li>[Objective 1]</li><li>[Objective 2]</li></ul>
<h2>Phase 1: Planning</h2>
<ul><li>[ ] Define requirements</li><li>[ ] Create timeline</li><li>[ ] Assign team roles</li></ul>
<h2>Phase 2: Execution</h2>
<ul><li>[ ] [Task 1]</li><li>[ ] [Task 2]</li><li>[ ] [Task 3]</li></ul>
<h2>Phase 3: Review & Launch</h2>
<ul><li>[ ] QA testing</li><li>[ ] Stakeholder review</li><li>[ ] Launch</li></ul>
<h2>📝 Notes</h2>
<p>[Additional notes, risks, dependencies]</p>`,
  },
  {
    id: 'brainstorm',
    icon: Lightbulb,
    title: 'Brainstorm',
    desc: 'Idea capture with categories',
    content: `<h1>💡 Brainstorm: [Topic]</h1>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<h2>🌟 Big Ideas</h2>
<ul><li>[Idea 1]</li><li>[Idea 2]</li><li>[Idea 3]</li></ul>
<h2>🔍 Questions to Explore</h2>
<ul><li>[Question 1]</li><li>[Question 2]</li></ul>
<h2>✅ Promising — Worth Pursuing</h2>
<p>[Ideas that passed initial filter]</p>
<h2>❌ Parked — Not Now</h2>
<p>[Ideas to revisit later]</p>
<h2>🚀 Next Steps</h2>
<ul><li>[ ] [Action item]</li><li>[ ] [Action item]</li></ul>`,
  },
  {
    id: 'blank',
    icon: FileText,
    title: 'Blank Document',
    desc: 'Start from scratch',
    content: '<p></p>',
  },
];

export default function TemplateGallery({ isOpen, onClose, onSelect }) {
  const { t } = useTranslation();
  const [hoveredId, setHoveredId] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="template-overlay" onClick={onClose}>
      <div className="template-gallery fade-in" onClick={e => e.stopPropagation()}>
        <div className="template-gallery__header">
          <div>
            <h2>📄 {t('templates.title')}</h2>
            <p>{t('templates.subtitle')}</p>
          </div>
          <button className="template-gallery__close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="template-gallery__grid">
          {TEMPLATES.map(tmpl => {
            const Icon = tmpl.icon;
            return (
              <div
                key={tmpl.id}
                className={`template-card ${hoveredId === tmpl.id ? 'template-card--hover' : ''}`}
                onMouseEnter={() => setHoveredId(tmpl.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => {
                  onSelect(tmpl.title === 'Blank Document' ? 'Untitled' : tmpl.title, tmpl.content);
                  onClose();
                }}
              >
                <div className="template-card__icon"><Icon size={24} /></div>
                <h4>{tmpl.title}</h4>
                <p>{tmpl.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
