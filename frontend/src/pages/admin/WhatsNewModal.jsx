import React, { useEffect, useRef } from "react";
import "./whats-new-modal.css";

export default function WhatsNewModal({
  open = true,
  onClose = () => {},
  onDontShowAgainChange = () => {},
  dontShowAgain = false,
  updates = defaultUpdates,
  title = "What’s New",
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="wnm-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="wnm-modal" ref={dialogRef}>
        <header className="wnm-header">
          <h2 className="wnm-title">{title}</h2>
          <button className="wnm-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="wnm-content">
          {updates.map((u, idx) => (
            <article className="wnm-card" key={idx}>
              <div className="wnm-date">{u.date}</div>
              <h3 className="wnm-headline">{u.headline}</h3>

              <p className="wnm-greeting">{u.greeting}</p>
              {u.paragraphs?.map((p, i) => (
                <p className="wnm-paragraph" key={i}>{p}</p>
              ))}

              {u.listTitle && <div className="wnm-list-title">{u.listTitle}</div>}
              {u.list && (
                <ul className="wnm-list">
                  {u.list.map((item, i) => (
                    <li key={i} className="wnm-list-item">
                      <span className="wnm-bullet" aria-hidden="true">{item.icon}</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              )}

              {u.cta && (
                <div className="wnm-cta-wrap">
                  <button className="wnm-btn" onClick={u.cta.onClick}>
                    {u.cta.label}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>

        <footer className="wnm-footer">
          <label className="wnm-checkbox">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => onDontShowAgainChange(e.target.checked)}
            />
            <span>Don’t show this again</span>
          </label>
        </footer>
      </div>
    </div>
  );
}

// --------- contoh data default sesuai desain ----------
const defaultUpdates = [
  {
    date: "23 June 2025, 15.09 WIB",
    headline: "New Campaign Features at Blasterc – Ready to Boost Your Business?",
    greeting: "Hey Blasterian!",
    paragraphs: [
      "We’re launching new updates to make your bulk WhatsApp campaigns even smoother!",
    ],
    listTitle: "✨ WHAT’S NEW?",
    list: [
      { icon: "✅", text: "Fresh log in & registration interface" },
      { icon: "✅", text: "All-in-one dashboard: track credit & campaign stats" },
      { icon: "✅", text: "Upload campaign numbers via .TXT file!" },
      { icon: "✅", text: "Fast & secure USDT TRC20 deposit system" },
      { icon: "✅", text: "Active referral system – invite & earn 🐝" },
      { icon: "✅", text: "Full campaign history & real-time reports" },
      { icon: "✅", text: "Notifications now live on your dashboard!" },
    ],
    paragraphs2: [],
  },
  {
    date: "22 June 2025, 12.00 WIB",
    headline: "Ready to Launch Bigger WhatsApp Campaigns?",
    greeting: "Hey Blasterian! Time to level up your business.",
    paragraphs: [
      "With our new campaign features and top-up via USDT TRC20, you can:",
    ],
    list: [
      { icon: "✅", text: "Send bulk messages faster" },
      { icon: "✅", text: "Upload numbers via .txt file" },
      { icon: "✅", text: "Add campaign images" },
      { icon: "✅", text: "Track results directly on your dashboard" },
      { icon: "🐝", text: "Top up now with a minimum of 10 USDT to unlock the full campaign experience!" },
      { icon: "🚀", text: "More credits = Wider reach = Better results." },
    ],
    cta: {
      label: "Create Campaign",
      onClick: () => alert("Create Campaign clicked"),
    },
  },
];
