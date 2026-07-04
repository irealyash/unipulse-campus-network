/**
 * PrivacyModal — read-only modal displaying the Privacy Policy.
 *
 * Contains the full privacy policy text in scrollable sections. Opened
 * from the signup/login footer links.
 *
 * Props:
 * @param {boolean}    open    — controls modal visibility
 * @param {() => void} onClose — close callback
 */
import { CloseIcon } from './icons';

export default function PrivacyModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-3xl max-w-2xl max-h-[85vh] flex flex-col p-0">
        <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
          <h2 className="font-bold text-xl">Privacy Policy</h2>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6 text-sm text-base-content/80 space-y-4">
          <p className="text-xs text-base-content/50">Last updated: June 27, 2026</p>

          <section>
            <h3 className="font-semibold text-base-content mb-1">1. Introduction</h3>
            <p>
              UniPulse (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, and disclose your information when you
              use our platform.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base-content mb-1">2. Information We Collect</h3>
            <p>
              We collect information you provide directly, such as your student email address and
              class schedule information, to verify your identity and facilitate community features.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base-content mb-1">3. How We Use Your Information</h3>
            <p className="mb-2">We use the collected information to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Verify student status.</li>
              <li>Provide and maintain our community features.</li>
              <li>Improve and personalize the user experience.</li>
              <li>Communicate with you regarding your account.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base-content mb-1">4. Data Security</h3>
            <p>
              We implement security measures designed to protect your personal information from
              unauthorized access, disclosure, or alteration.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base-content mb-1">5. Disclosure to Third Parties</h3>
            <p>
              We do not sell your personal information. We only share data with service providers
              necessary to operate the platform, or if required by law.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base-content mb-1">6. Your Rights</h3>
            <p>
              You have the right to access, correct, or request the deletion of your personal
              information held by us.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base-content mb-1">7. Changes to This Policy</h3>
            <p>
              We may update this policy periodically. Continued use of the platform after updates
              constitutes acceptance of the revised policy.
            </p>
          </section>

          <p className="text-xs text-base-content/50 pt-2 border-t border-base-200">
            © 2026 UniPulse. All rights reserved.
          </p>
        </div>
      </div>
      <button
        type="button"
        className="modal-backdrop bg-black/40"
        onClick={onClose}
        aria-label="Close privacy policy"
      />
    </div>
  );
}
