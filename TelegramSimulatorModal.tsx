"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Send, 
  Mic, 
  Camera, 
  Paperclip, 
  Bot, 
  User, 
  CheckCheck, 
  AlertCircle,
  HelpCircle,
  CreditCard,
  PieChart
} from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { parseNaturalLanguageInput, parseReceiptImageInput, parseVoiceNoteInput } from "@/lib/telegram/parser";
import { formatExpenseReply, formatIncomeReply, handleBotCommand, generateAIAdvisorAdvice } from "@/lib/telegram/bot-reply";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  transcript?: string;
  isPhoto?: boolean;
}

export function TelegramSimulatorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { 
    user, 
    wallets, 
    categories, 
    budgets, 
    transactions, 
    addTransaction,
    addAILog 
  } = useAppData();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m0",
      sender: "bot",
      text: `👋 Halo ${user.full_name}! Ini adalah simulator bot TataDana (@TataDanaBot).\n\nKamu bisa coba ketik pesan santai seperti:\n• "beli nasi padang 28rb"\n• "gajian kantor 8.5jt"\n• atau coba command /saldo, /budget, /hari ini`,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecordingVN, setIsRecordingVN] = useState(false);
  const [vnSeconds, setVnSeconds] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    let interval: any;
    if (isRecordingVN) {
      interval = setInterval(() => {
        setVnSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setVnSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVN]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setInput("");

    const nowTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: `msg_${Date.now()}`, sender: "user", text: userText, time: nowTime },
    ]);

    setIsTyping(true);

    // Process input after slight realistic bot latency
    setTimeout(() => {
      setIsTyping(false);

      // Check if command
      if (userText.startsWith("/")) {
        const reply = handleBotCommand(userText, user, wallets, transactions, budgets, categories);
        setMessages((prev) => [
          ...prev,
          { id: `bot_${Date.now()}`, sender: "bot", text: reply, time: nowTime },
        ]);
        return;
      }

      // Natural language financial parser
      const startTime = performance.now();
      const parsed = parseNaturalLanguageInput(userText);
      const latency = Math.round(performance.now() - startTime);

      addAILog({
        provider: "gemini",
        feature: "parse_text",
        tokens_used: 85,
        latency_ms: latency,
        status: parsed.success ? "success" : "error",
        error_message: parsed.errorMessage || null,
      });

      if (!parsed.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: "bot",
            text: parsed.errorMessage || "Format tidak dikenali.",
            time: nowTime,
          },
        ]);
        return;
      }

      // Find matching wallet (use default wallet)
      const defaultWallet = wallets.find((w) => w.is_default) || wallets[0];
      // Find matching category
      const matchedCat = categories.find((c) => c.name.toLowerCase() === parsed.categoryName?.toLowerCase()) || categories[0];

      // Insert transaction into database
      const result = addTransaction({
        wallet_id: defaultWallet.id,
        category_id: matchedCat.id,
        type: parsed.type!,
        amount: parsed.amount!,
        date: new Date().toISOString(),
        notes: parsed.notes,
        source: "telegram_text",
      });

      if (result.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            sender: "bot",
            text: `⚠️ ${result.error}`,
            time: nowTime,
          },
        ]);
        return;
      }

      // Format reply
      let botReply = "";
      const updatedBalance = parsed.type === "income" 
        ? defaultWallet.balance + parsed.amount! 
        : defaultWallet.balance - parsed.amount!;

      if (parsed.type === "expense") {
        const matchingBudget = budgets.find((b) => b.category_id === matchedCat.id);
        const currentMonth = new Date().toISOString().slice(0, 7);
        const spentSoFar = transactions
          .filter((t) => t.category_id === matchedCat.id && t.date.slice(0, 7) === currentMonth && t.type === "expense")
          .reduce((acc, t) => acc + t.amount, 0) + parsed.amount!;

        botReply = formatExpenseReply({
          date: new Date(),
          walletName: defaultWallet.name,
          categoryName: matchedCat.name,
          categoryIcon: matchedCat.icon,
          amount: parsed.amount!,
          notes: parsed.notes || "",
          remainingBalance: updatedBalance,
          budget: matchingBudget,
          categorySpentThisMonth: spentSoFar,
        });

        // Trigger AI advisor if Pro plan
        const advisor = generateAIAdvisorAdvice(user, [...transactions, result.transaction]);
        if (advisor && Math.random() > 0.5) {
          botReply += `\n\n${advisor}`;
        }
      } else {
        botReply = formatIncomeReply({
          date: new Date(),
          walletName: defaultWallet.name,
          categoryName: matchedCat.name,
          categoryIcon: matchedCat.icon,
          amount: parsed.amount!,
          notes: parsed.notes || "",
          remainingBalance: updatedBalance,
        });
      }

      setMessages((prev) => [
        ...prev,
        { id: `bot_${Date.now()}`, sender: "bot", text: botReply, time: nowTime },
      ]);
    }, 600);
  };

  const handleSimulateVoiceNote = (transcriptSample: string, duration = 12) => {
    setIsRecordingVN(false);
    const nowTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [
      ...prev,
      {
        id: `vn_${Date.now()}`,
        sender: "user",
        text: `🎙️ Pesan Suara (${duration} detik)`,
        time: nowTime,
      },
    ]);

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const parsed = parseVoiceNoteInput(transcriptSample, duration);

      addAILog({
        provider: "gemini",
        feature: "speech_to_text",
        tokens_used: 240,
        latency_ms: 780,
        status: parsed.success ? "success" : "error",
      });

      if (!parsed.success) {
        setMessages((prev) => [
          ...prev,
          { id: `bot_${Date.now()}`, sender: "bot", text: parsed.errorMessage || "Gagal memproses suara.", time: nowTime },
        ]);
        return;
      }

      const defaultWallet = wallets.find((w) => w.is_default) || wallets[0];
      const matchedCat = categories.find((c) => c.name.toLowerCase() === parsed.categoryName?.toLowerCase()) || categories[0];

      const result = addTransaction({
        wallet_id: defaultWallet.id,
        category_id: matchedCat.id,
        type: parsed.type!,
        amount: parsed.amount!,
        date: new Date().toISOString(),
        notes: parsed.notes,
        source: "telegram_voice",
      });

      if (result.error) {
        setMessages((prev) => [
          ...prev,
          { id: `bot_${Date.now()}`, sender: "bot", text: `⚠️ ${result.error}`, time: nowTime },
        ]);
        return;
      }

      const updatedBalance = defaultWallet.balance - parsed.amount!;
      const reply = formatExpenseReply({
        date: new Date(),
        walletName: defaultWallet.name,
        categoryName: matchedCat.name,
        categoryIcon: matchedCat.icon,
        amount: parsed.amount!,
        notes: parsed.notes || "",
        remainingBalance: updatedBalance,
        transcript: parsed.transcript,
      });

      setMessages((prev) => [
        ...prev,
        { id: `bot_${Date.now()}`, sender: "bot", text: reply, time: nowTime },
      ]);
    }, 700);
  };

  const handleSimulateReceipt = () => {
    const nowTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [
      ...prev,
      {
        id: `img_${Date.now()}`,
        sender: "user",
        text: `📸 Foto Struk Belanja`,
        time: nowTime,
        isPhoto: true,
      },
    ]);

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const parsed = parseReceiptImageInput("receipt_sample.jpg", user.plan_tier);

      addAILog({
        provider: "openai",
        feature: "ocr_receipt",
        tokens_used: 680,
        latency_ms: 1100,
        status: parsed.success ? "success" : "error",
      });

      if (!parsed.success) {
        setMessages((prev) => [
          ...prev,
          { id: `bot_${Date.now()}`, sender: "bot", text: parsed.errorMessage || "", time: nowTime },
        ]);
        return;
      }

      const defaultWallet = wallets.find((w) => w.is_default) || wallets[0];
      const matchedCat = categories.find((c) => c.name === "Belanja Harian") || categories[0];

      const result = addTransaction({
        wallet_id: defaultWallet.id,
        category_id: matchedCat.id,
        type: "expense",
        amount: parsed.amount!,
        date: new Date().toISOString(),
        notes: parsed.notes,
        merchant_name: parsed.merchantName,
        is_receipt_parent: true,
        source: "telegram_photo",
        receipt_image_url: "https://images.unsplash.com/photo-1554415707-9e4426d02928?w=500&auto=format&fit=crop&q=80",
        items: parsed.items,
      });

      let reply = `📅 ${new Date().toLocaleDateString("id-ID")}\n📸 Struk Belanja ${parsed.merchantName} Tercatat!\n`;
      reply += `├ Total : Rp${parsed.amount?.toLocaleString("id-ID")}\n`;
      reply += `├ Rincian (${parsed.items?.length} item):\n`;
      parsed.items?.forEach((it) => {
        reply += `  • ${it.item_name} (x${it.quantity}) : Rp${it.price.toLocaleString("id-ID")}\n`;
      });
      reply += `└ Dompet : 👛 ${defaultWallet.name}\n\n`;
      reply += `Semua item otomatis disimpan rapi ke dashboard Laporan TataDana!`;

      setMessages((prev) => [
        ...prev,
        { id: `bot_${Date.now()}`, sender: "bot", text: reply, time: nowTime },
      ]);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[650px] border border-slate-200">
        {/* Telegram Header */}
        <div className="bg-[#242F3D] text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-inner">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-sm">TataDana Bot</span>
                <span className="bg-orange-500/30 text-orange-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Official
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                <span>online • @TataDanaBot</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telegram Chat Wallpaper Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0E1621]/5 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
          {messages.map((m) => {
            const isUser = m.sender === "user";
            return (
              <div
                key={m.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"} items-end space-x-1.5`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold">
                    TD
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                    isUser
                      ? "bg-orange-600 text-white rounded-br-none"
                      : "bg-white text-slate-800 rounded-bl-none border border-slate-100"
                  }`}
                >
                  {m.text}
                  <div
                    className={`text-[10px] mt-1 flex items-center justify-end space-x-1 ${
                      isUser ? "text-orange-200" : "text-slate-400"
                    }`}
                  >
                    <span>{m.time}</span>
                    {isUser && <CheckCheck className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center space-x-2 text-xs text-slate-500 italic bg-white/80 w-fit px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              <span>TataDana Bot sedang mengetik...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex items-center space-x-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-500 shrink-0">Coba tes:</span>
          <button
            onClick={() => setInput("beli soto ayam 25rb")}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 transition shrink-0"
          >
            🍜 soto 25rb
          </button>
          <button
            onClick={() => setInput("isi bensin shell 100k")}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 transition shrink-0"
          >
            🚗 bensin 100k
          </button>
          <button
            onClick={() => setInput("gajian kantor 8.5jt")}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 transition shrink-0"
          >
            💰 gajian 8.5jt
          </button>
          <button
            onClick={() => setInput("/saldo")}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 transition shrink-0 font-mono"
          >
            /saldo
          </button>
          <button
            onClick={() => setInput("/budget")}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 transition shrink-0 font-mono"
          >
            /budget
          </button>
          <button
            onClick={() => setInput("/hari ini")}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 transition shrink-0 font-mono"
          >
            /hari ini
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
          {/* Action buttons: Photo Receipt & VN simulation */}
          <button
            title="Kirim Foto Struk (Pro)"
            onClick={handleSimulateReceipt}
            className="p-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition"
          >
            <Camera className="w-5 h-5" />
          </button>

          <button
            title="Kirim Voice Note"
            onClick={() => handleSimulateVoiceNote("beli kopi susu senja dua puluh lima ribu")}
            className={`p-2 rounded-xl transition ${
              isRecordingVN 
                ? "bg-red-500 text-white animate-pulse" 
                : "text-slate-500 hover:text-orange-600 hover:bg-orange-50"
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ketik transaksi atau /perintah..."
            className="flex-1 bg-slate-100 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-orange-500 transition shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
