import { useMemo, useState } from "react";
import { Languages } from "lucide-react";
import { LANGS, makeT } from "./i18n";
import { trackFile } from "./api";
import TrackForm from "./components/TrackForm";
import FileResult from "./components/FileResult";

const LANG_KEY = "citizen-portal-lang";

const readLang = () => {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "sw" || stored === "en") return stored;
  } catch {
    /* private mode / blocked storage -- fall through to default */
  }
  return "sw";
};

const App = () => {
  const [lang, setLang] = useState(readLang);
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");

  const t = useMemo(() => makeT(lang), [lang]);

  const changeLang = (code) => {
    setLang(code);
    try {
      localStorage.setItem(LANG_KEY, code);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    setErrorText("");
    try {
      const data = await trackFile(values);
      setResult(data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) setErrorText(t("notFound"));
      else if (status === 429) setErrorText(t("rateLimited"));
      else setErrorText(t("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setErrorText("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="/coat-of-arms.png" alt={t("council")} className="h-10 w-10 rounded-full object-cover" />
            <div className="leading-tight">
              <p className="text-sm font-bold text-primaryBlue">{t("portalName")}</p>
              <p className="text-xs text-gray-500">{t("council")}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
            <Languages size={14} className="ml-1.5 text-gray-400" />
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => changeLang(l.code)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  lang === l.code ? "bg-white text-primaryBlue shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {l.code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:py-14">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t("heroTitle")}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{t("heroSubtitle")}</p>
        </div>

        {result ? (
          <FileResult result={result} lang={lang} t={t} onReset={reset} />
        ) : (
          <TrackForm t={t} onSubmit={handleSubmit} isSubmitting={isSubmitting} errorText={errorText} />
        )}
      </main>

      <footer className="border-t border-gray-100 bg-white">
        <p className="mx-auto max-w-2xl px-4 py-5 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {t("footer")}
        </p>
      </footer>
    </div>
  );
};

export default App;
