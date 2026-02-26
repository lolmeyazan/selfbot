import React from "react";
import { Link } from "wouter";
import { ShieldAlert, ExternalLink } from "lucide-react";
import { MatrixRain } from "@/components/effects/MatrixRain";
import { CrtOverlay } from "@/components/effects/CrtOverlay";

const laws = [
  {
    title: "Discord Terms of Service",
    href: "https://discord.com/terms",
    note: "Platform usage terms, account behavior, and enforcement rights.",
  },
  {
    title: "Discord Developer Terms",
    href: "https://discord.com/developers/docs/policies-and-agreements/developer-terms-of-service",
    note: "Rules for API and developer usage.",
  },
  {
    title: "Discord Developer Policy",
    href: "https://discord.com/developers/docs/policies-and-agreements/developer-policy",
    note: "Restrictions, abuse prevention, and automation policy.",
  },
  {
    title: "18 U.S.C. §1030 (CFAA - U.S.)",
    href: "https://www.law.cornell.edu/uscode/text/18/1030",
    note: "Unauthorized access and misuse of computer systems can carry penalties.",
  },
];

export default function Rules() {
  return (
    <div className="min-h-screen bg-black text-primary relative overflow-hidden">
      <MatrixRain opacity={0.12} />
      <CrtOverlay />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        <div className="neon-border bg-black/80 backdrop-blur-sm p-5 sm:p-8 shadow-[0_0_30px_rgba(0,255,65,0.1)] space-y-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-destructive" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-destructive">Rules & Liability Policy</h1>
              <p className="font-mono text-sm text-primary/70">Read fully before accessing the control panel.</p>
            </div>
          </div>

          <div className="border border-destructive/40 bg-destructive/10 p-4 font-mono text-sm leading-relaxed text-gray-200">
            This page is an informational policy notice, not legal advice. You are solely responsible for how you use this software.
            If you need legal interpretation, consult a licensed attorney in your jurisdiction.
          </div>

          <div className="space-y-3 font-mono text-sm leading-relaxed text-gray-200">
            <p><span className="text-primary">1. Personal Responsibility:</span> You accept full responsibility for all actions performed through this software.</p>
            <p><span className="text-primary">2. No Liability:</span> Developers, maintainers, and contributors are not liable for account loss, bans, data loss, legal claims, or damages resulting from use.</p>
            <p><span className="text-primary">3. Ownership Requirement:</span> You must only use credentials/accounts you own or are explicitly authorized to manage.</p>
            <p><span className="text-primary">4. Policy Compliance:</span> You must comply with Discord rules, API policies, and applicable local/international laws.</p>
            <p><span className="text-primary">5. Risk Acknowledgment:</span> Platform enforcement may include temporary or permanent account restrictions without warning.</p>
            <p><span className="text-primary">6. Security Duty:</span> Protect credentials, never share sensitive tokens, and use secure local storage practices.</p>
            <p><span className="text-primary">7. Abuse Prohibited:</span> Harassment, spam, unauthorized automation, and disruptive behavior are prohibited.</p>
            <p><span className="text-primary">8. Jurisdiction:</span> You are responsible for understanding and complying with laws applicable in your country/state.</p>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-mono text-primary">Official References</h2>
            <div className="grid grid-cols-1 gap-2">
              {laws.map((law) => (
                <a
                  key={law.href}
                  href={law.href}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-border bg-black/40 p-3 hover:border-primary/60 transition-colors flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-mono text-sm text-white">{law.title}</div>
                    <div className="font-mono text-xs text-primary/70">{law.note}</div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
                </a>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Link href="/" className="font-mono text-sm border border-primary px-4 py-2 hover:bg-primary/10 transition-colors">
              Back To Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
