/**
 * @fileoverview Syncs translations across locale files: root billing from dashboard.billing,
 * fills CymaSynth pricing keys, and reports remaining English-identical strings.
 * @module scripts/sync-locale-translations
 * @note Run: node scripts/sync-locale-translations.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "..", "public", "locales");
const LANGS = ["es", "fr", "it", "de", "pt", "tr", "zh", "ja"];

const en = JSON.parse(
  fs.readFileSync(path.join(localesDir, "en.json"), "utf8"),
);

/** @brief CymaSynth checklist + related copy per language. */
const CYMA_PATCHES = {
  de: {
    cymaSynthFeature: "CymaSynth Standalone-App, AU & VST3",
    includedSynth:
      "Enthält CymaSynth—einen professionellen Wavetable-Synthesizer (Standalone-App, VST3 & AU)—bei jedem Abonnement und jeder Lifetime-Lizenz gebündelt. Komplette Kompositions-Suite und Flaggschiff-Instrument in einem.",
    progressionFeature6:
      "Dynamische Pattern-Updates: Patterns und Voicings passen sich automatisch an, wenn sich die Progression ändert",
  },
  es: {
    cymaSynthFeature: "CymaSynth Standalone, AU y VST3",
    includedSynth:
      "Incluye CymaSynth—un sintetizador wavetable profesional (app standalone, VST3 y AU)—incluido con cada suscripción y licencia de por vida. Suite de composición completa e instrumento insignia, juntos.",
    progressionFeature6:
      "Actualizaciones dinámicas de patrones: los patrones y voicings se adaptan automáticamente cuando cambia la progresión",
  },
  fr: {
    cymaSynthFeature: "CymaSynth autonome, AU et VST3",
    includedSynth:
      "Inclut CymaSynth—un synthétiseur wavetable professionnel (app autonome, VST3 et AU)—inclus avec chaque abonnement et licence à vie. Suite de composition complète et instrument phare réunis.",
    progressionFeature6:
      "Mises à jour dynamiques des motifs : les motifs et les voicings s’adaptent automatiquement lorsque la progression change",
  },
  it: {
    cymaSynthFeature: "CymaSynth Standalone, AU e VST3",
    includedSynth:
      "Include CymaSynth—un sintetizzatore wavetable professionale (app standalone, VST3 e AU)—incluso con ogni abbonamento e licenza a vita. Suite di composizione completa e strumento di punta insieme.",
    progressionFeature6:
      "Aggiornamenti dinamici dei pattern: pattern e voicing si adattano automaticamente quando cambia la progressione",
  },
  pt: {
    cymaSynthFeature: "CymaSynth Standalone, AU e VST3",
    includedSynth:
      "Inclui o CymaSynth—um sintetizador wavetable profissional (app standalone, VST3 e AU)—incluído em cada assinatura e licença vitalícia. Suite de composição completa e instrumento principal juntos.",
    progressionFeature6:
      "Atualizações dinâmicas de padrões: padrões e voicings se adaptam automaticamente quando a progressão muda",
  },
  tr: {
    cymaSynthFeature: "CymaSynth Bağımsız, AU ve VST3",
    includedSynth:
      "CymaSynth—profesyonel wavetable sentezleyici (bağımsız uygulama, VST3 ve AU)—her abonelik ve ömür boyu lisansla birlikte gelir. Tam kompozisyon paketi ve amiral gemisi enstrüman tek pakette.",
    progressionFeature6:
      "Dinamik desen güncellemeleri: progresyon değiştiğinde desenler ve voicing’ler otomatik uyum sağlar",
  },
  zh: {
    cymaSynthFeature: "CymaSynth 独立版、AU 与 VST3",
    includedSynth:
      "包含 CymaSynth—专业波表合成器（独立应用、VST3 与 AU）—随每次订阅与终身许可捆绑。完整作曲套件与旗舰乐器合一。",
    progressionFeature6:
      "动态 pattern 更新：进行变化时，pattern 与 voicing 自动适配",
  },
  ja: {
    cymaSynthFeature: "CymaSynth スタンドアロン、AU・VST3",
    includedSynth:
      "CymaSynth—プロ仕様のウェーブテーブルシンセ（スタンドアロンアプリ、VST3・AU）—を全サブスクリプションと永久ライセンスに同梱。作曲スイートとフラッグシップ楽器をひとつに。",
    progressionFeature6:
      "動的パターン更新：進行が変わるとパターンとボイシングが自動的に追従",
  },
};

/** @brief Root-level billing strings (used by PlanSelectionModal). */
const ROOT_BILLING = {
  de: {
    enterCardNow: "Karteninformationen jetzt eingeben:",
    percentDiscount: "{{percent}} % Rabatt angewendet!",
    amountDiscount: "{{amount}} $ Rabatt!",
    oneTimePurchase: "Einmaliger Kauf",
    provideCard: "Zahlungsmethode jetzt für {{days}}-Tage-Testversion angeben",
    cardTooltip:
      "Wenn Sie jetzt eine Zahlungsmethode hinzufügen, verlängert sich Ihre Testversion auf 14 statt 7 Tage. Bis zum Testende wird nichts berechnet.",
  },
  fr: {
    choosePlan: "Choisissez votre forfait",
    limitedOffer: "Offre à durée limitée",
    startWithTrial:
      "Commencez avec un essai GRATUIT de {{days}} jours sur n'importe quel forfait !",
    trialExperience:
      "Profitez de toutes les fonctionnalités premium sans engagement. Aucune carte de crédit requise pour commencer.",
    yearlyToMonthly:
      "Votre abonnement est facturé annuellement. Si vous passez au mensuel, le changement prendra effet après la fin de votre période actuelle le {{date}}.",
    monthly: "Mensuel",
    yearly: "Annuel",
    save25: "Économisez 25 %",
    lifetime: "À vie",
    bestValue: "Meilleur rapport qualité-prix",
    enterCardNow: "Saisir la carte maintenant :",
    trialWithCard: "Essai {{days}} jours — Ajouter une carte",
    trialWithoutCard: "Essai {{days}} jours — Sans carte bancaire",
    currentPlan: "Forfait actuel",
    afterTrial: "Après votre essai gratuit de {{days}} jours",
    percentDiscount: "{{percent}} % de réduction appliquée !",
    amountDiscount: "{{amount}} $ de réduction !",
    firstPayment: "Premier paiement : {{date}}",
    nextBilling: "Prochaine facturation : {{date}}",
    oneTimePurchase: "achat unique",
    purchased: "Acheté",
    allPlansInclude: "Tous les forfaits incluent :",
    confirmationNote:
      "En confirmant, vous acceptez les conditions et les prix affichés ci-dessus.",
    provideCard:
      "Indiquez un moyen de paiement maintenant pour un essai de {{days}} jours",
    cardTooltip:
      "Ajouter un moyen de paiement prolonge l'essai à 14 jours au lieu de 7. Aucun débit avant la fin de l'essai.",
    chooseTrial: "Choisissez votre option d'essai gratuit :",
    noCharge: "(aucun débit avant la fin de l'essai)",
  },
  it: {
    enterCardNow: "Inserisci i dati della carta ora:",
    percentDiscount: "Sconto del {{percent}}% applicato!",
    amountDiscount: "{{amount}} $ di sconto!",
    oneTimePurchase: "acquisto una tantum",
    provideCard: "Fornisci il metodo di pagamento ora per una prova di {{days}} giorni",
    cardTooltip:
      "Aggiungendo il metodo di pagamento ora estendi la prova a 14 giorni invece di 7. Non verrai addebitato fino alla fine della prova.",
  },
  pt: {
    enterCardNow: "Informar cartão agora:",
    percentDiscount: "{{percent}}% de desconto aplicado!",
    amountDiscount: "{{amount}} $ de desconto!",
    oneTimePurchase: "compra única",
    provideCard: "Informe o pagamento agora para um teste de {{days}} dias",
    cardTooltip:
      "Adicionar o pagamento agora estende o teste para 14 dias em vez de 7. Você só será cobrado ao final do teste.",
  },
  tr: {
    enterCardNow: "Kart bilgilerini şimdi girin:",
    percentDiscount: "%{{percent}} indirim uygulandı!",
    amountDiscount: "{{amount}} $ indirim!",
    oneTimePurchase: "tek seferlik satın alma",
    provideCard: "{{days}} günlük deneme için şimdi ödeme yöntemi ekleyin",
    cardTooltip:
      "Ödeme yöntemini şimdi eklemek denemenizi 7 gün yerine 14 güne uzatır. Deneme bitene kadar ücret alınmaz.",
  },
  zh: {
    enterCardNow: "立即填写银行卡信息：",
    percentDiscount: "已应用 {{percent}}% 折扣！",
    amountDiscount: "立减 ${{amount}}！",
    oneTimePurchase: "一次性购买",
    provideCard: "立即提供支付方式以开始 {{days}} 天试用",
    cardTooltip:
      "现在添加支付方式可将试用从 7 天延长至 14 天。试用结束前不会扣款。",
  },
  ja: {
    enterCardNow: "今すぐカード情報を入力：",
    percentDiscount: "{{percent}}% 割引を適用しました！",
    amountDiscount: "${{amount}} オフ！",
    oneTimePurchase: "買い切り",
    provideCard: "{{days}} 日間トライアルのために今すぐ支払い方法を登録",
    cardTooltip:
      "今すぐ支払い方法を追加すると、トライアルが 7 日から 14 日に延長されます。トライアル終了まで請求されません。",
  },
};

/** @brief Shared dashboard / about copy still missing in some locales. */
const MISC_PATCHES = {
  de: {
    amountOnDate: "{{amount}} am {{date}}",
    pleaseSignIn: "Bitte melden Sie sich an, um auf Ihr Dashboard zuzugreifen",
    featureMIDI: "MIDI-Export & -Import",
    upgradeDowngrade: "Upgrade / Downgrade",
    gotIt: "Verstanden",
    ipadTitle: "Cymasphere für iPad",
    ipadDesc:
      "Native iPad-App mit vollem Funktionsumfang, für iPad optimiert. Jetzt im App Store.",
    viewOnAppStore: "Im App Store ansehen",
    member1: "Gründer & Lead-Entwickler",
    member2: "Spezialist für Musiktheorie",
    member4: "Produktmanager",
  },
  fr: {
    amountOnDate: "{{amount}} le {{date}}",
    upgradeDowngrade: "Mettre à niveau / Rétrograder",
    cancelSubscription: "Annuler l'abonnement",
    reactivateSubscription: "Réactiver l'abonnement",
    paymentMethods: "Moyens de paiement",
    addPaymentMethod: "Ajouter un moyen de paiement",
    noPaymentHistory: "Aucun historique de paiement",
    ipadTitle: "Cymasphere pour iPad",
    ipadDesc:
      "Application iPad native avec toutes les fonctionnalités, optimisée pour iPad. Disponible sur l'App Store.",
    viewOnAppStore: "Voir sur l'App Store",
    privacyIntro: "1. Introduction",
    member1: "Fondateur et développeur principal",
    member2: "Spécialiste en théorie musicale",
    member4: "Chef de produit",
  },
  es: {
    progressionFeature6:
      "Actualizaciones dinámicas de patrones: los patrones y voicings se adaptan automáticamente cuando cambia la progresión",
    amountOnDate: "{{amount}} el {{date}}",
    ipadTitle: "Cymasphere para iPad",
    ipadDesc:
      "App nativa para iPad con todas las funciones, optimizada para iPad. Disponible en App Store.",
    viewOnAppStore: "Ver en App Store",
    member1: "Fundador y desarrollador principal",
    member2: "Especialista en teoría musical",
    member4: "Gerente de producto",
  },
  it: {
    progressionFeature6:
      "Aggiornamenti dinamici dei pattern: pattern e voicing si adattano automaticamente quando cambia la progressione",
    ipadTitle: "Cymasphere per iPad",
    ipadDesc:
      "App nativa per iPad con tutte le funzionalità, ottimizzata per iPad. Disponibile su App Store.",
    viewOnAppStore: "Vedi su App Store",
  },
  pt: {
    progressionFeature6:
      "Atualizações dinâmicas de padrões: padrões e voicings se adaptam automaticamente quando a progressão muda",
    contactDescription:
      "Adoraríamos ouvir você! Se tiver dúvidas sobre recursos, preços ou quiser compartilhar feedback, nossa equipe está aqui para ajudar. Preencha o formulário e responderemos o mais rápido possível.",
    contactEmailInfo: "Você também pode nos contatar diretamente em",
    contactSuccess: "Obrigado! Sua mensagem foi enviada com sucesso.",
    contactError: "Ops! Algo deu errado. Tente novamente.",
    learnStep4Title: "Aprimore suas habilidades",
    learnStep4Desc:
      "Aprimore seu ouvido musical experimentando substituições de acordes e intercâmbio modal. Ao refinar suas escolhas harmônicas, você desenvolverá uma compreensão mais profunda das qualidades dos acordes e progressões, fortalecendo técnica e voz criativa.",
    integrateStep4Title: "Fluxo de trabalho integrado",
    integrateStep4Desc:
      "Integre o Cymasphere ao seu processo de produção como gerador de harmonia e padrões—depois dê voz às suas ideias com o CymaSynth, sintetizador wavetable profissional incluído no seu plano (app standalone, VST3 e AU). Envie MIDI do Cymasphere para qualquer instrumento ou crie patches no CymaSynth para um fluxo completo do esboço ao som.",
    upgradeDowngrade: "Fazer upgrade / downgrade",
    ipadTitle: "Cymasphere para iPad",
    ipadDesc:
      "App nativo para iPad com conjunto completo de recursos, otimizado para iPad. Disponível na App Store.",
    viewOnAppStore: "Ver na App Store",
  },
  tr: {
    progressionFeature6:
      "Dinamik desen güncellemeleri: progresyon değiştiğinde desenler ve voicing’ler otomatik uyum sağlar",
    learnStep4Title: "Becerilerinizi geliştirin",
    learnStep4Desc:
      "Farklı akor yer değiştirmeleri ve modal interchange ile deney yaparak müzikal kulağınızı geliştirin. Armonik seçimlerinizi iyileştirdikçe akor kaliteleri ve progresyonları daha derin anlarsınız; teknik beceri ve yaratıcı sesiniz doğal olarak güçlenir.",
    integrateStep4Title: "Sorunsuz iş akışı",
    integrateStep4Desc:
      "Cymasphere’i güçlü bir armoni ve desen üreteci olarak üretim sürecinize entegre edin—ardından planınıza dahil profesyonel wavetable sentezleyici CymaSynth ile (bağımsız uygulama, VST3 ve AU) fikirlerinize ses verin. Cymasphere’den herhangi bir enstrümana MIDI gönderin veya eskizden sese tam bir akış için CymaSynth’te patch tasarlayın.",
    continueToCheckout: "Ödemeye devam et",
    ipadTitle: "iPad için Cymasphere",
    ipadDesc:
      "iPad için optimize edilmiş, tam özellikli yerel uygulama. App Store’da mevcut.",
    viewOnAppStore: "App Store’da görüntüle",
  },
  zh: {
    progressionFeature6:
      "动态 pattern 更新：进行变化时，pattern 与 voicing 自动适配",
    macosTitle: "macOS 版 Cymasphere",
    windowsTitle: "Windows 版 Cymasphere",
    ipadTitle: "iPad 版 Cymasphere",
    ipadDesc: "原生 iPad 应用，功能完整并为 iPad 优化。现已在 App Store 提供。",
    viewOnAppStore: "在 App Store 查看",
  },
  ja: {
    amountOnDate: "{{date}}に {{amount}}",
    upgradeDowngrade: "アップグレード / ダウングレード",
    cancelSubscription: "サブスクリプションを解約",
    reactivateSubscription: "サブスクリプションを再開",
    paymentMethods: "支払い方法",
    addPaymentMethod: "支払い方法を追加",
    noPaymentHistory: "支払い履歴がありません",
    ipadTitle: "iPad 版 Cymasphere",
    ipadDesc:
      "iPad 向けに最適化されたネイティブアプリ。全機能を利用できます。App Store で配信中。",
    viewOnAppStore: "App Store で見る",
    member1: "創業者兼リード開発者",
    member2: "音楽理論スペシャリスト",
    member4: "プロダクトマネージャー",
    upgradeToLifetime: "ライフタイムアクセスにアップグレード",
  },
};

/** @brief Remaining UI strings that were still identical to English. */
const FINAL_MISC = {
  es: {
    availableNow: "Disponible ahora",
    member3Role: "Diseñador UI/UX",
  },
  fr: {
    availableNow: "Disponible maintenant",
    transactionId: "Identifiant de transaction",
    notifications: "Notifications et alertes",
    bDiminished: "Si diminué",
    member3Role: "Designer UI/UX",
    privacyIntroTitle: "1. Présentation",
  },
  it: {
    availableNow: "Disponibile ora",
    songBuilderTitle: "Costruttore di brani",
    member3Role: "Designer UI/UX",
  },
  de: {
    availableNow: "Jetzt verfügbar",
    unknownError: "Unbekannter Fehler",
    bDiminished: "H vermindert",
    member3Role: "UI/UX-Designer",
  },
  pt: {
    availableNow: "Disponível agora",
    contactEmailLabel: "Endereço de e-mail",
    contactSubmit: "Enviar mensagem",
    member3Role: "Designer UI/UX",
  },
  tr: {
    availableNow: "Şimdi kullanılabilir",
    member3Role: "UI/UX Tasarımcısı",
  },
  zh: {
    availableNow: "现已上线",
    member3Role: "UI/UX 设计师",
  },
  ja: {
    availableNow: "今すぐ利用可能",
    bDiminished: "H短調",
    member3Role: "UI/UXデザイナー",
  },
};

/**
 * @brief Copy translated dashboard.billing values into root billing when root still matches English.
 * @param {object} data - Locale JSON object.
 */
function syncRootBillingFromDashboard(data) {
  const dash = data.dashboard?.billing;
  const root = data.billing;
  const enRoot = en.billing;
  if (!dash || !root || !enRoot) return 0;
  let n = 0;
  for (const key of Object.keys(enRoot)) {
    if (
      root[key] === enRoot[key] &&
      typeof dash[key] === "string" &&
      dash[key] !== enRoot[key]
    ) {
      root[key] = dash[key];
      n++;
    }
  }
  return n;
}

/**
 * @brief Copy translated root billing into dashboard.billing when dashboard still matches English.
 * @param {object} data - Locale JSON object.
 */
function syncDashboardBillingFromRoot(data) {
  const dash = data.dashboard?.billing;
  const root = data.billing;
  const enDash = en.dashboard?.billing;
  if (!dash || !root || !enDash) return 0;
  let n = 0;
  for (const key of Object.keys(enDash)) {
    if (
      typeof dash[key] === "string" &&
      dash[key] === enDash[key] &&
      typeof root[key] === "string" &&
      root[key] !== enDash[key]
    ) {
      dash[key] = root[key];
      n++;
    }
  }
  return n;
}

/**
 * @brief Apply CymaSynth and misc translation patches to a locale file.
 * @param {string} lang - Locale code.
 * @param {object} data - Locale JSON object.
 */
function applyPatches(lang, data) {
  const cyma = CYMA_PATCHES[lang];
  if (cyma) {
    data.pricing = data.pricing || {};
    data.pricing.cymaSynthFeature = cyma.cymaSynthFeature;
    if (Array.isArray(data.pricing.features)) {
      data.pricing.features = data.pricing.features.filter(
        (f) => typeof f !== "string" || !/cymaSynth/i.test(f),
      );
      data.pricing.features.push(cyma.cymaSynthFeature);
    }
    if (data.hero) data.hero.includedSynth = cyma.includedSynth;
    if (data.features?.progressionTimeline?.features?.[6]) {
      data.features.progressionTimeline.features[6] = cyma.progressionFeature6;
    }
  }

  const billing = ROOT_BILLING[lang];
  if (billing && data.billing) {
    Object.assign(data.billing, billing);
  }

  const misc = MISC_PATCHES[lang];
  if (misc) {
    if (misc.amountOnDate && data.dashboard?.main) {
      data.dashboard.main.amountOnDate = misc.amountOnDate;
    }
    if (misc.pleaseSignIn && data.dashboard?.main) {
      data.dashboard.main.pleaseSignIn = misc.pleaseSignIn;
    }
    if (misc.featureMIDI && data.dashboard?.main) {
      data.dashboard.main.featureMIDI = misc.featureMIDI;
    }
    if (data.dashboard?.billing) {
      if (misc.upgradeDowngrade)
        data.dashboard.billing.upgradeDowngrade = misc.upgradeDowngrade;
      if (misc.cancelSubscription)
        data.dashboard.billing.cancelSubscription = misc.cancelSubscription;
      if (misc.reactivateSubscription)
        data.dashboard.billing.reactivateSubscription =
          misc.reactivateSubscription;
      if (misc.paymentMethods)
        data.dashboard.billing.paymentMethods = misc.paymentMethods;
      if (misc.addPaymentMethod)
        data.dashboard.billing.addPaymentMethod = misc.addPaymentMethod;
      if (misc.noPaymentHistory)
        data.dashboard.billing.noPaymentHistory = misc.noPaymentHistory;
      if (misc.continueToCheckout)
        data.dashboard.billing.continueToCheckout = misc.continueToCheckout;
      if (misc.gotIt) data.dashboard.billing.gotIt = misc.gotIt;
    }
    if (misc.upgradeToLifetime && data.dashboard?.main) {
      data.dashboard.main.upgradeToLifetime = misc.upgradeToLifetime;
    }
    if (data.dashboard?.downloads) {
      if (misc.macosTitle) data.dashboard.downloads.macosTitle = misc.macosTitle;
      if (misc.windowsTitle)
        data.dashboard.downloads.windowsTitle = misc.windowsTitle;
      if (misc.ipadTitle) data.dashboard.downloads.ipadTitle = misc.ipadTitle;
      if (misc.ipadDesc) data.dashboard.downloads.ipadDesc = misc.ipadDesc;
      if (misc.viewOnAppStore)
        data.dashboard.downloads.viewOnAppStore = misc.viewOnAppStore;
    }
    if (data.contact) {
      if (misc.contactDescription) data.contact.description = misc.contactDescription;
      if (misc.contactEmailInfo) data.contact.emailInfo = misc.contactEmailInfo;
      if (misc.contactSuccess) data.contact.successMessage = misc.contactSuccess;
      if (misc.contactError) data.contact.errorMessage = misc.contactError;
    }
    if (data.howItWorks?.learnWorkflow?.step4) {
      if (misc.learnStep4Title)
        data.howItWorks.learnWorkflow.step4.title = misc.learnStep4Title;
      if (misc.learnStep4Desc)
        data.howItWorks.learnWorkflow.step4.description = misc.learnStep4Desc;
    }
    if (data.howItWorks?.integrateWorkflow?.step4) {
      if (misc.integrateStep4Title)
        data.howItWorks.integrateWorkflow.step4.title = misc.integrateStep4Title;
      if (misc.integrateStep4Desc)
        data.howItWorks.integrateWorkflow.step4.description = misc.integrateStep4Desc;
    }
    if (misc.privacyIntro && data.legal?.privacy?.intro) {
      data.legal.privacy.intro.title = misc.privacyIntro;
    }
    if (data.aboutUs?.team) {
      if (misc.member1) data.aboutUs.team.member1.role = misc.member1;
      if (misc.member2) data.aboutUs.team.member2.role = misc.member2;
      if (misc.member4) data.aboutUs.team.member4.role = misc.member4;
    }
    if (misc.progressionFeature6 && data.features?.progressionTimeline?.features) {
      data.features.progressionTimeline.features[6] = misc.progressionFeature6;
    }
  }

  const fin = FINAL_MISC[lang];
  if (fin) {
    if (fin.availableNow && data.dashboard?.downloads) {
      data.dashboard.downloads.availableNow = fin.availableNow;
    }
    if (fin.transactionId && data.dashboard?.billing) {
      data.dashboard.billing.transactionId = fin.transactionId;
    }
    if (fin.notifications && data.dashboard?.settings) {
      data.dashboard.settings.notifications = fin.notifications;
    }
    if (fin.bDiminished && data.hero?.chords) {
      data.hero.chords.bDiminished = fin.bDiminished;
    }
    if (fin.unknownError && data.common) {
      data.common.unknownError = fin.unknownError;
    }
    if (fin.songBuilderTitle && data.features?.songBuilder) {
      data.features.songBuilder.title = fin.songBuilderTitle;
    }
    if (fin.contactEmailLabel && data.contact) {
      data.contact.emailLabel = fin.contactEmailLabel;
    }
    if (fin.contactSubmit && data.contact) {
      data.contact.submitButton = fin.contactSubmit;
    }
    if (fin.member3Role && data.aboutUs?.team?.member3) {
      data.aboutUs.team.member3.role = fin.member3Role;
    }
    if (fin.privacyIntroTitle && data.legal?.privacy?.intro) {
      data.legal.privacy.intro.title = fin.privacyIntroTitle;
    }
  }
}

for (const lang of LANGS) {
  const p = path.join(localesDir, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  const syncedRoot = syncRootBillingFromDashboard(data);
  const syncedDash = syncDashboardBillingFromRoot(data);
  applyPatches(lang, data);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(
    `${lang}: root billing ${syncedRoot}, dashboard billing ${syncedDash}, patches applied`,
  );
}

console.log("done");
