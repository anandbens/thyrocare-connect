import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "919876543210"; // Replace with actual number
const WHATSAPP_MESSAGE = encodeURIComponent("Hi! I'd like to know more about your lab tests and health packages.");

const WhatsAppButton = () => {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white px-5 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6 fill-white" />
      <span className="text-sm font-semibold hidden sm:inline">Chat with us</span>
    </a>
  );
};

export default WhatsAppButton;
