
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "917389264730";

const MESSAGE =
  "Namaste Vishal Electricals! Mujhe aapki website se related help chahiye. Kripya meri sahayata karein.";

export default function WhatsAppSupport() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    MESSAGE
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact Vishal Electricals on WhatsApp"
      title="WhatsApp Help & Support"
      className="fixed bottom-6 right-5 z-50 flex items-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#1ebe5d] sm:bottom-8 sm:right-8"
    >
      <MessageCircle size={25} />
      <span className="text-sm font-semibold">
        Help & Support
      </span>
    </a>
  );
}
