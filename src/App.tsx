/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Mail, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  FileText,
  Euro,
  User,
  Hash,
  Languages,
  Sparkles
} from 'lucide-react';
import { 
  parseAanslagnummer, 
  convertToBetalingskenmerk, 
  formatBetalingskenmerk 
} from './lib/tax-logic.ts';
import { 
  generateNLTemplate, 
  generateENTemplate 
} from './lib/email-templates.ts';

type Language = 'NL' | 'EN';

interface GeneratedData {
  kenmerk: string;
  formattedKenmerk: string;
  parsed: any;
  bedrag: string;
  clientNaam: string;
  winst: string;
  dagtekening: string;
  betaalDatumFormatted: string;
}

export default function App() {
  const [aanslagnummer, setAanslagnummer] = useState('');
  const [bedrag, setBedrag] = useState('');
  const [clientNaam, setClientNaam] = useState('');
  const [winst, setWinst] = useState('');
  const [dagtekening, setDagtekening] = useState('');
  const [language, setLanguage] = useState<Language>('NL');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);

  const calculateBetaalDatum = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      let date: Date;
      
      // Try parsing DD-MM-YYYY or DD/MM/YYYY
      const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (ddmmyyyyMatch) {
        const day = parseInt(ddmmyyyyMatch[1], 10);
        const month = parseInt(ddmmyyyyMatch[2], 10) - 1; // 0-indexed
        const year = parseInt(ddmmyyyyMatch[3], 10);
        date = new Date(year, month, day);
      } else {
        date = new Date(dateStr);
      }

      if (isNaN(date.getTime())) return '';
      // 6 weeks = 42 days. Minus 1 day = 41 days.
      date.setDate(date.getDate() + 41);
      return date.toLocaleDateString(language === 'NL' ? 'nl-NL' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const handleGenerate = (e?: FormEvent) => {
    if (e) e.preventDefault();
    
    try {
      setError(null);
      if (!aanslagnummer.trim()) {
        throw new Error('Voer a.u.b. een aanslagnummer in.');
      }
      const parsed = parseAanslagnummer(aanslagnummer);
      const kenmerk = convertToBetalingskenmerk(parsed);
      
      setGeneratedData({
        kenmerk,
        formattedKenmerk: formatBetalingskenmerk(kenmerk),
        parsed,
        bedrag,
        clientNaam,
        winst,
        dagtekening,
        betaalDatumFormatted: calculateBetaalDatum(dagtekening)
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er is een fout opgetreden bij het genereren.');
      setGeneratedData(null);
    }
  };

  const emailTemplate = useMemo(() => {
    if (!generatedData) return '';
    
    const formatCurrency = (val: string) => {
      if (!val) return '€ 0';
      // NL parsing: dots are thousands, comma is decimal
      const cleanVal = val.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(cleanVal) || 0;
      
      // Format with spaces for thousands and comma for decimals
      return '€ ' + new Intl.NumberFormat('nl-NL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(num).replace(/\./g, ' ');
    };

    const templateData = {
      clientNaam: generatedData.clientNaam,
      formattedBedrag: formatCurrency(generatedData.bedrag),
      formattedWinst: formatCurrency(generatedData.winst),
      formattedKenmerk: generatedData.formattedKenmerk,
      aanslagnummer: generatedData.parsed.raw,
      betaalDatumFormatted: generatedData.betaalDatumFormatted,
      winst: generatedData.winst
    };

    return language === 'NL' 
      ? generateNLTemplate(templateData) 
      : generateENTemplate(templateData);
  }, [generatedData, language]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">
              Betalingskenmerk<span className="text-blue-600">Hulp</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-5 space-y-6">
            <form onSubmit={handleGenerate} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Invoer Gegevens
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    Aanslagnummer
                  </label>
                  <input
                    type="text"
                    value={aanslagnummer}
                    onChange={(e) => setAanslagnummer(e.target.value)}
                    placeholder="Bijv. 0000.00.000.V.00.0000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Ondersteunt VpB, BTW, LB en IB
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Dagtekening (voor betaaltermijn)
                  </label>
                  <input
                    type="text"
                    value={dagtekening}
                    onChange={(e) => setDagtekening(e.target.value)}
                    placeholder="DD-MM-YYYY (bijv. 15-11-2025)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Betaaltermijn wordt automatisch berekend (6 weken - 1 dag)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                    <Euro className="w-3.5 h-3.5" />
                    Te betalen (€)
                  </label>
                  <input
                    type="text"
                    value={bedrag}
                    onChange={(e) => setBedrag(e.target.value)}
                    placeholder="Bijv. 10.000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Aanspreektitel klant
                  </label>
                  <input
                    type="text"
                    value={clientNaam}
                    onChange={(e) => setClientNaam(e.target.value)}
                    placeholder="Bijv. Dhr. Jansen"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                      <Euro className="w-3.5 h-3.5" />
                      Belastbare winst (Optioneel)
                    </label>
                    <input
                      type="text"
                      value={winst}
                      onChange={(e) => setWinst(e.target.value)}
                      placeholder="Bijv. 150000"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2 group"
                >
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Genereer kenmerk en mail
                </button>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-700 text-sm"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </form>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-blue-800 text-sm">
              <h3 className="font-semibold mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Privacy & Veiligheid
              </h3>
              <p className="text-blue-700 leading-relaxed">
                Deze tool verwerkt alle gegevens lokaal in uw browser. Er wordt <strong>geen</strong> data opgeslagen of gelogd.
              </p>
            </div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-7 space-y-6">
            <AnimatePresence mode="wait">
              {generatedData ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        BEREKEND
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                          Betalingskenmerk
                        </h3>
                        <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100 group">
                          <span className="text-3xl md:text-4xl font-mono font-bold text-slate-800 tracking-tight">
                            {generatedData.formattedKenmerk}
                          </span>
                          <button
                            onClick={() => copyToClipboard(generatedData.kenmerk)}
                            className="p-3 bg-white shadow-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 hover:text-blue-600"
                            title="Kopieer kenmerk"
                          >
                            {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Middel</span>
                          <span className="font-mono font-semibold text-blue-600">{generatedData.parsed.middel}</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Controlecijfer</span>
                          <span className="font-mono font-semibold text-blue-600">{generatedData.kenmerk[0]}</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                      <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <Mail className="w-5 h-5 text-blue-600" />
                          Conceptmail
                        </h2>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                          <button
                            onClick={() => setLanguage('NL')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${language === 'NL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            NL
                          </button>
                          <button
                            onClick={() => setLanguage('EN')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${language === 'EN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            EN
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(emailTemplate)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Kopieer e-mail
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        readOnly
                        value={emailTemplate}
                        className="w-full h-64 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-mono text-slate-700 resize-none outline-none"
                      />
                      <div className="absolute bottom-4 right-4">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-300 uppercase">
                          Concept gegenereerd
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </section>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                    <Calculator className="w-10 h-10 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-600">Klaar voor berekening</h3>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto">
                      Vul de gegevens in en druk op de knop (of Enter) om het kenmerk en de mail te genereren.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="mt-auto py-8 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-xs">
            © 2026 BetalingskenmerkHulp - Gebaseerd op Belastingdienst Specificatie v1.5
          </p>
        </div>
      </footer>

      {/* Toast Notification */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 z-50"
          >
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">Gekopieerd naar klembord</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
