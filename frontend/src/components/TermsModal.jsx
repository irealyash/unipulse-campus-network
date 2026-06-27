import { CloseIcon } from './icons';

export default function TermsModal({ open, onClose }) {
    if (!open) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box rounded-3xl max-w-2xl max-h-[85vh] flex flex-col p-0">
                <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
                    <h2 className="font-bold text-xl">Terms and Conditions</h2>
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
                            Welcome to our platform. By accessing or using our services, you agree to be bound by
                            these Terms and Conditions. If you disagree with any part of these terms, you may not
                            access the service.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-base-content mb-1">2. User Accounts</h3>
                        <p>
                            You are responsible for safeguarding the password that you use to access the platform.
                            You agree not to disclose your password to any third party. You are responsible for any
                            activity under your account.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-base-content mb-1">3. Content and Conduct</h3>
                        <p>
                            Users must not post content that is unlawful, harmful, threatening, abusive, harassing,
                            defamatory, vulgar, obscene, or racially or ethnically offensive. We reserve the right
                            to remove any content that violates these policies.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-base-content mb-1">4. Intellectual Property</h3>
                        <p>
                            The Service and its original content, features, and functionality are and will remain
                            the exclusive property of our platform and its licensors.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-base-content mb-1">5. Termination</h3>
                        <p>
                            We may terminate or suspend your account immediately, without prior notice or
                            liability, for any reason whatsoever, including without limitation if you breach the
                            Terms.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-base-content mb-1">6. Limitation of Liability</h3>
                        <p>
                            In no event shall the platform, nor its directors, employees, partners, agents,
                            suppliers, or affiliates, be liable for any indirect, incidental, special,
                            consequential or punitive damages resulting from your use of the service.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-base-content mb-1">7. Governing Law</h3>
                        <p>
                            These Terms shall be governed and construed in accordance with the laws of British
                            Columbia, Canada, without regard to its conflict of law provisions.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-base-content mb-1">8. Changes to Terms</h3>
                        <p>
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any
                            time. By continuing to access or use our service after those revisions become
                            effective, you agree to be bound by the revised terms.
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
                aria-label="Close terms"
            />
        </div>
    );
}
