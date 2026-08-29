import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "en";

const dict = {
  ar: {
    club: "نادي أثر",
    fair: "ملتقى الأندية",
    planted: "أثر انغرس",
    question: "ما الأثر الذي تريد تركه؟",
    writeMine: "أكتب أثرك",
    scan: "امسح واترك أثرك",
    langSwitch: "EN",
    introTitle: ["خمس ثواني.", "سؤال واحد.", "أثر يبقى."],
    introBody:
      "مو صندوق يوقف الطابور. اللحظة على جوالك، وبعدها أثرك يظهر على الجدار قدام الكل.",
    enter: "ادخل اللحظة",
    think: "فكّر. لا تكتب للحين.",
    skip: "تخطى",
    writeTitle: "أكتب أثرُك في جملة",
    writeHint: "بدون اسم. يظهر على الجدار.",
    writePlaceholder: "أخلي أحد يحس إنه قادر",
    plant: "اغرس الأثر",
    planting: "ينغرس...",
    tooShort: "اكتب جملة قصيرة.",
    saveFail: "ما قدرنا نحفظ الأثر.",
    doneTitle: "أثرُك انغرس.",
    doneHint: "ارفع راسك على الجدار. لو تبي تكمل الأثر، تعال الركن وتعرّف علينا.",
    another: "أثر ثاني",
    back: "ارجع للجدار",
    qrLabel: "رمز المشاركة",
    viewAll: "جميع الآثار",
    allTitle: "جميع الآثار",
    allEmpty: "ما انغرس أثر للحين.",
    inspire: "إلهام",
    inspireLead: "أُلقيَت حصاةٌ صغيرة في ماءٍ ساكن…",
    inspireRest:
      "فاختفت، لكن الدوائر التي صنعَتها ظلّت تمتد. هكذا قد يكون أثرك؛ قد لا ترى إلى أين يصل، لكن هذا لا يعني أنه توقّف.",
  },
  en: {
    club: "Athar Club",
    fair: "Clubs Fair",
    planted: "impacts planted",
    question: "What impact do you want to leave?",
    writeMine: "Write yours",
    scan: "Scan and leave yours",
    langSwitch: "عربي",
    introTitle: ["Five seconds.", "One question.", "An impact that stays."],
    introBody: "No box. No queue. The moment is on your phone — then it appears on the wall.",
    enter: "Enter the moment",
    think: "Think. Don't write yet.",
    skip: "Skip",
    writeTitle: "Write your impact in one line",
    writeHint: "No name. It shows on the wall.",
    writePlaceholder: "I help someone believe they can",
    plant: "Plant it",
    planting: "Planting...",
    tooShort: "Write a short sentence.",
    saveFail: "Could not save your impact.",
    doneTitle: "Your impact is on the wall.",
    doneHint: "Look up. If you want to go further, come meet us at the booth.",
    another: "Another impact",
    back: "Back to the wall",
    qrLabel: "Share code",
    viewAll: "All impacts",
    allTitle: "All impacts",
    allEmpty: "Nothing planted yet.",
    inspire: "Inspiration",
    inspireLead: "A small stone was cast into still water.",
    inspireRest:
      "It disappeared, but the ripples it created kept spreading. Your impact may be the same; you may never see how far it reaches, but that doesn’t mean it has stopped.",
  },
} as const;

type Copy = (typeof dict)[Lang];
type LocaleValue = {
  lang: Lang;
  t: Copy;
  toggle: () => void;
  formatNum: (n: number) => string;
};
const LocaleContext = createContext<LocaleValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");
  useEffect(() => {
    const saved = window.localStorage.getItem("athar-lang");
    if (saved === "en" || saved === "ar") setLang(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("athar-lang", lang);
  }, [lang]);
  const value = useMemo<LocaleValue>(
    () => ({
      lang,
      t: dict[lang],
      toggle: () => setLang((cur) => (cur === "ar" ? "en" : "ar")),
      formatNum: (n) => n.toLocaleString(lang === "ar" ? "ar-SA" : "en-US"),
    }),
    [lang],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale");
  return ctx;
}
