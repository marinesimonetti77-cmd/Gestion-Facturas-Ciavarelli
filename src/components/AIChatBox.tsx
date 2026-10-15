import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Calendar,
  AlertTriangle,
  DollarSign,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { SurgicalCase, Invoice } from '../types/surgical';
import { formatCurrency, CurrencyCode } from '../lib/currency';
import { getInvoiceUrgency, getDaysDifference } from '../lib/surgicalLogic';

interface AIChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
  cases: SurgicalCase[];
  invoices: Invoice[];
  currency: CurrencyCode;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AIChatBox: React.FC<AIChatBoxProps> = ({
  isOpen,
  onClose,
  cases,
  invoices,
  currency,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: '¡Hola! Soy tu Asistente Quirúrgico y Auditor de Cobranzas. Puedo informarte sobre cirugías programadas, fechas estimadas de cobro vencidas, estado de prótesis o desgloses por clínica. ¿En qué te puedo ayudar hoy?',
      timestamp: 'Ahora',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Context-aware response generation
    setTimeout(() => {
      const responseText = generateAssistantResponse(query, cases, invoices, currency);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  const generateAssistantResponse = (
    query: string,
    allCases: SurgicalCase[],
    allInvoices: Invoice[],
    curr: CurrencyCode
  ): string => {
    const q = query.toLowerCase();

    // 1. Facturas vencidas o cobranzas atrasadas
    if (q.includes('vencid') || q.includes('mora') || q.includes('atrasad') || q.includes('fecha de cobro')) {
      const overdue = allInvoices.filter(
        i => i.status !== 'COBRADA' && (getInvoiceUrgency(i.expectedCollectionDate, i.status) === 'overdue' || i.status === 'VENCIDA')
      );

      if (overdue.length === 0) {
        return '✅ ¡Buenas noticias! No hay facturas con fecha estimada de cobro vencida actualmente. Todas las cobranzas están al día o en plazo.';
      }

      let summary = `⚠️ Encontré ${overdue.length} factura(s) con fecha de cobro vencida:\n\n`;
      overdue.forEach((inv, idx) => {
        const days = Math.abs(getDaysDifference(inv.expectedCollectionDate));
        summary += `${idx + 1}. **${inv.invoiceNumber}** · ${inv.patientName} (${inv.insuranceProvider})\n` +
          `   - Monto: **${formatCurrency(inv.totalAmount, curr)}**\n` +
          `   - Fecha estimada: ${inv.expectedCollectionDate} (Atraso: ${days} días)\n` +
          `   - Estado: ${inv.status}${inv.auditNotes ? ` (${inv.auditNotes})` : ''}\n\n`;
      });
      summary += '💡 Sugerencia: Se recomienda contactar a la auditoría de la obra social o sanatorio para verificar el número de liquidación.';
      return summary;
    }

    // 2. Cirugías programadas / próximas
    if (q.includes('programada') || q.includes('proxima') || q.includes('cronograma') || q.includes('semana')) {
      const scheduled = allCases.filter(c => c.status === 'PROGRAMADA' || c.status === 'REPROGRAMADA');

      if (scheduled.length === 0) {
        return 'No hay cirugías programadas en el sistema en este momento.';
      }

      let summary = `🗓️ Hay ${scheduled.length} cirugía(s) programada(s):\n\n`;
      scheduled.forEach((c, idx) => {
        summary += `${idx + 1}. **${c.patientName}** (HC: ${c.patientMedicalRecordNumber})\n` +
          `   - Procedimiento: ${c.procedureName}\n` +
          `   - Fecha y Hora: ${c.surgeryDate} a las ${c.surgeryTime} hs\n` +
          `   - Clínica: ${c.estimatedSurgeryClinic} (${c.operatingRoom || 'Quirófano por asignar'})\n` +
          `   - Cirujano: ${c.surgeonName}\n\n`;
      });
      return summary;
    }

    // 3. Materiales / Prótesis pendientes
    if (q.includes('protesis') || q.includes('material') || q.includes('implante') || q.includes('insumo')) {
      const casesWithMats = allCases.filter(c => (c.materials || []).some(m => m.status === 'SOLICITADO'));

      if (casesWithMats.length === 0) {
        return '📦 Todos los materiales e implantes de las cirugías activas ya fueron entregados en clínica o utilizados. No hay pedidos pendientes de entrega.';
      }

      let summary = `📦 Hay ${casesWithMats.length} cirugía(s) con prótesis/insumos en estado SOLICITADO:\n\n`;
      casesWithMats.forEach(c => {
        const pending = (c.materials || []).filter(m => m.status === 'SOLICITADO');
        summary += `• **${c.patientName}** · Cirugía: ${c.surgeryDate} en ${c.estimatedSurgeryClinic}\n`;
        pending.forEach(p => {
          summary += `   - ${p.description} (Cant: ${p.quantity}) - Proveedor: ${p.supplier}\n`;
        });
        summary += '\n';
      });
      return summary;
    }

    // 4. Cirugías realizadas sin facturar
    if (q.includes('sin facturar') || q.includes('pendiente de facturar') || q.includes('factura pendiente')) {
      const unbilled = allCases.filter(c => c.status === 'REALIZADA' && !c.invoiceId);

      if (unbilled.length === 0) {
        return '✅ Todas las cirugías realizadas ya tienen una factura asociada emitida o cobrada.';
      }

      let summary = `📋 Hay ${unbilled.length} cirugía(s) REALIZADA(S) que aún no tienen factura emitida:\n\n`;
      unbilled.forEach((c, idx) => {
        summary += `${idx + 1}. **${c.patientName}** - ${c.procedureName} (Fecha: ${c.surgeryDate})\n` +
          `   - Sanatorio: ${c.estimatedSurgeryClinic} · Obra Social: ${c.insuranceProvider}\n\n`;
      });
      summary += '💡 Puedes hacer clic en "Generar Factura" directamente desde la tabla de casos para liquidarlas.';
      return summary;
    }

    // 5. Total facturado y cobranzas generales
    if (q.includes('total') || q.includes('cuanto') || q.includes('plata') || q.includes('monto') || q.includes('recaud')) {
      let billed = 0;
      let collected = 0;
      let pending = 0;
      allInvoices.forEach(i => {
        billed += i.totalAmount;
        if (i.status === 'COBRADA') collected += i.totalAmount;
        else pending += i.totalAmount;
      });

      return `💰 **Resumen Financiero Consolidado:**\n\n` +
        `• **Total Facturado:** ${formatCurrency(billed, curr)}\n` +
        `• **Total Cobrado:** ${formatCurrency(collected, curr)} (${billed > 0 ? Math.round((collected / billed) * 100) : 0}%)\n` +
        `• **Saldo Pendiente de Cobro:** ${formatCurrency(pending, curr)}\n\n` +
        `Total de comprobantes registrados: ${allInvoices.length}.`;
    }

    // Default intelligent answer
    return `Entendido sobre "${query}".\n\n` +
      `Puedes consultarme por:\n` +
      `• "¿Cuáles facturas tienen fecha de cobro vencida?"\n` +
      `• "¿Qué cirugías están programadas para esta semana?"\n` +
      `• "¿Qué prótesis o implantes están pendientes de entrega?"\n` +
      `• "¿Cuáles cirugías realizadas faltan facturar?"\n` +
      `• "¿Cuál es el monto total facturado y cobrado?"`;
  };

  const QUICK_PROMPTS = [
    'Facturas vencidas',
    'Cirugías programadas',
    'Prótesis pendientes',
    'Cirugías sin facturar',
    'Resumen financiero',
  ];

  return (
    <div className="fixed bottom-4 right-4 z-40 w-full max-w-sm sm:max-w-md shadow-2xl transition-all duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Asistente Quirúrgico & Auditoría</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <p className="text-[10px] text-slate-400">Consultas en vivo sobre cirugías y cobranzas</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Minimized view check */}
        {!isMinimized && (
          <>
            {/* Quick Prompts */}
            <div className="bg-slate-950/80 px-3 py-2 border-b border-slate-800 flex gap-1.5 overflow-x-auto text-[11px]">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => handleSendMessage(p)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 transition"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Messages Body */}
            <div className="p-4 overflow-y-auto max-h-[360px] space-y-3 bg-slate-950/50 text-xs">
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 whitespace-pre-wrap leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-800 text-slate-200 border border-slate-750 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 px-1">
                    {m.timestamp}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 p-2">
                  <Bot className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
                  <span>Analizando casos y liquidaciones...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Pregunta sobre cirugías, cobros o prótesis..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
