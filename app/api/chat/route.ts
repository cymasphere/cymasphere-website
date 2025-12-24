/**
 * @fileoverview AI chat assistant API endpoint
 * 
 * This endpoint provides an AI-powered chat assistant for Cymasphere using
 * OpenAI GPT with RAG (Retrieval Augmented Generation) for context-aware
 * responses. Supports multiple languages and includes keyword-based fallback
 * responses when OpenAI is unavailable. Uses multilingual FAQ responses for
 * common questions.
 * 
 * @module api/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { cymasphereRAG } from '@/lib/rag';

/**
 * Chat message interface
 */
interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

/**
 * Chat request interface
 */
interface ChatRequest {
  message: string;
  conversationHistory: ChatMessage[];
  language?: string;
}

/**
 * OpenAI client instance initialized with API key from environment variables
 * Null if API key is not configured
 */
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Multilingual FAQ responses
const FAQ_RESPONSES: Record<string, Record<string, { keywords: string[], response: string }>> = {
  en: {
    smalltalk: {
      keywords: [
        'how are you',
        "how's it going",
        'hows it going',
        "what's up",
        'whats up',
        'sup',
        'yo',
        'hey there'
      ],
      response: "I'm doing great and ready to help with your music. Are you focusing on chord progressions, melodies, or arranging a full song?"
    },
    pricing: {
      keywords: ['price', 'cost', 'pricing', 'subscription', 'plan', 'free', 'trial', 'money'],
      response: "Cymasphere keeps pricing simple—Monthly $6, Yearly $59 (save 25%), Lifetime $149. Which option best fits how you plan to use Cymasphere?"
    },
    features: {
      keywords: ['feature', 'tool', 'synthesizer', 'drum', 'instrument', 'effect', 'what can', 'capabilities'],
      response: "Cymasphere helps with chords, melody patterns, voice-led progressions, and DAW integration (AU/VST3/Standalone). What are you creating—progressions, melodies, or arranging a full song?"
    },
    getting_started: {
      keywords: ['start', 'begin', 'how to', 'tutorial', 'learn', 'new user', 'first time'],
      response: "Quick start: build a chord progression with the Harmony Palette, enable Voicing Generator for smooth transitions, then add a melody in the Dynamic Pattern Editor. Would you like a 3-step guide for your DAW?"
    },
    support: {
      keywords: ['help', 'support', 'problem', 'issue', 'bug', 'contact', 'customer service'],
      response: "I can help troubleshoot. Cymasphere includes built-in help and premium support. What's blocking you right now in your workflow?"
    },
    comparison: {
      keywords: ['vs', 'compare', 'better than', 'alternative', 'competitor', 'fl studio', 'ableton', 'logic'],
      response: "Cymasphere complements your DAW by generating harmonically sound progressions, voice-led voicings, and adaptive melody patterns. What DAW are you using so I can tailor guidance?"
    },
    technical: {
      keywords: ['system requirements', 'specs', 'compatible', 'browser', 'device', 'performance'],
      response: "Cymasphere runs as Standalone, AU (macOS), and VST3—works with major DAWs on Mac/Windows. What OS and DAW are you on?"
    }
  },
  es: {
    smalltalk: {
      keywords: ['¿cómo estás', 'hola', 'qué tal', 'hey', 'oye'],
      response: "¡Muy bien y listo para ayudarte con tu música! ¿Te estás enfocando en progresiones de acordes, melodías o en arreglar una canción completa?"
    },
    pricing: {
      keywords: ['precio', 'costo', 'precios', 'suscripción', 'plan', 'gratis', 'prueba', 'dinero'],
      response: "Cymasphere mantiene los precios simples: Mensual $6, Anual $59 (ahorra 25%), De por vida $149. ¿Cuál opción se ajusta mejor a tu forma de usar Cymasphere?"
    },
    features: {
      keywords: ['característica', 'herramienta', 'sintetizador', 'batería', 'instrumento', 'efecto', 'qué puedes', 'capacidades'],
      response: "Cymasphere ayuda con acordes, patrones de melodía, progresiones con conducción de voces e integración DAW (AU/VST3/Standalone). ¿Qué estás creando: progresiones, melodías o arreglando una canción completa?"
    },
    getting_started: {
      keywords: ['empezar', 'comenzar', 'cómo', 'tutorial', 'aprender', 'usuario nuevo', 'primera vez'],
      response: "Inicio rápido: construye una progresión de acordes con la Paleta de Armonía, habilita el Generador de Voicing para transiciones suaves, luego añade una melodía en el Editor de Patrón Dinámico. ¿Quieres una guía de 3 pasos para tu DAW?"
    },
    support: {
      keywords: ['ayuda', 'soporte', 'problema', 'problema', 'bug', 'contacto', 'servicio al cliente'],
      response: "Puedo ayudarte a solucionar problemas. Cymasphere incluye ayuda integrada y soporte premium. ¿Qué es lo que te está bloqueando en tu flujo de trabajo ahora mismo?"
    },
    comparison: {
      keywords: ['vs', 'comparar', 'mejor que', 'alternativa', 'competidor', 'fl studio', 'ableton', 'logic'],
      response: "Cymasphere complementa tu DAW generando progresiones armónicamente sólidas, voicings con conducción de voz y patrones de melodía adaptables. ¿Qué DAW usas para que pueda adaptar la guía?"
    },
    technical: {
      keywords: ['requisitos del sistema', 'especificaciones', 'compatible', 'navegador', 'dispositivo', 'rendimiento'],
      response: "Cymasphere funciona como Standalone, AU (macOS) y VST3—compatible con DAWs principales en Mac/Windows. ¿Qué SO y DAW usas?"
    }
  },
  fr: {
    smalltalk: {
      keywords: ['comment ça va', 'ça va', 'salut', 'coucou', 'quoi de neuf'],
      response: "Je vais très bien et je suis prêt à vous aider avec votre musique. Vous vous concentrez sur les progressions d'accords, les mélodies ou l'arrangement d'une chanson complète ?"
    },
    pricing: {
      keywords: ['prix', 'coût', 'tarification', 'abonnement', 'plan', 'gratuit', 'essai', 'argent'],
      response: "Cymasphere maintient les prix simples : Mensuel $6, Annuel $59 (économisez 25%), À vie $149. Quelle option correspond le mieux à votre utilisation de Cymasphere ?"
    },
    features: {
      keywords: ['fonctionnalité', 'outil', 'synthétiseur', 'batterie', 'instrument', 'effet', 'que pouvez', 'capacités'],
      response: "Cymasphere aide avec les accords, les motifs de mélodie, les progressions avec conduite de voix et l'intégration DAW (AU/VST3/Standalone). Qu'est-ce que vous créez : des progressions, des mélodies ou une arrangement complète ?"
    },
    getting_started: {
      keywords: ['commencer', 'débuter', 'comment', 'tutoriel', 'apprendre', 'nouvel utilisateur', 'première fois'],
      response: "Démarrage rapide : construisez une progression d'accords avec la Palette d'Harmonie, activez le Générateur de Voicing pour des transitions en douceur, puis ajoutez une mélodie dans l'Éditeur de Motif Dynamique. Voulez-vous un guide en 3 étapes pour votre DAW ?"
    },
    support: {
      keywords: ['aide', 'support', 'problème', 'problème', 'bug', 'contact', 'service client'],
      response: "Je peux vous aider à résoudre les problèmes. Cymasphere inclut l'aide intégrée et le support premium. Qu'est-ce qui vous bloque dans votre flux de travail en ce moment ?"
    },
    comparison: {
      keywords: ['vs', 'comparer', 'meilleur que', 'alternative', 'concurrent', 'fl studio', 'ableton', 'logic'],
      response: "Cymasphere complète votre DAW en générant des progressions harmoniquement solides, des voicings avec conduite de voix et des motifs de mélodie adaptatifs. Quel DAW utilisez-vous pour que je puisse adapter mes conseils ?"
    },
    technical: {
      keywords: ['configuration requise', 'spécifications', 'compatible', 'navigateur', 'appareil', 'performance'],
      response: "Cymasphere fonctionne comme Standalone, AU (macOS) et VST3—compatible avec les principaux DAWs sur Mac/Windows. Quel OS et DAW utilisez-vous ?"
    }
  },
  de: {
    smalltalk: {
      keywords: ['wie geht es dir', 'wie geht', 'hallo', 'hi', 'was geht'],
      response: "Mir geht es großartig und ich helfe gerne bei deiner Musik. Konzentrierst du dich auf Akkordfolgen, Melodien oder die Anordnung eines kompletten Songs ?"
    },
    pricing: {
      keywords: ['preis', 'kosten', 'preise', 'abonnement', 'plan', 'kostenlos', 'testversion', 'geld'],
      response: "Cymasphere hält die Preise einfach: Monatlich $6, Jährlich $59 (sparen Sie 25%), Lebenslang $149. Welche Option passt am besten zu deiner Nutzung von Cymasphere ?"
    },
    features: {
      keywords: ['funktion', 'werkzeug', 'synthesizer', 'schlagzeug', 'instrument', 'effekt', 'was kann', 'funktionen'],
      response: "Cymasphere hilft mit Akkorden, Melodiemuster, Stimmführungs-Progressionen und DAW-Integration (AU/VST3/Standalone). Was erstellst du: Progressionen, Melodien oder ein komplettes Arrangement ?"
    },
    getting_started: {
      keywords: ['anfang', 'beginnen', 'wie', 'anleitung', 'lernen', 'neuer benutzer', 'erstes mal'],
      response: "Schnellstart: Erstelle eine Akkordfolge mit der Harmoniefarbpalette, aktiviere den Voicing-Generator für sanfte Übergänge, füge dann eine Melodie im Dynamic Pattern Editor hinzu. Möchtest du eine 3-Schritte-Anleitung für deine DAW ?"
    },
    support: {
      keywords: ['hilfe', 'unterstützung', 'problem', 'problem', 'bug', 'kontakt', 'kundendienst'],
      response: "Ich kann dir bei der Problembehandlung helfen. Cymasphere beinhaltet eingebaute Hilfe und Premium-Support. Was blockiert dich gerade in deinem Arbeitsablauf ?"
    },
    comparison: {
      keywords: ['vs', 'vergleichen', 'besser als', 'alternative', 'konkurrenz', 'fl studio', 'ableton', 'logic'],
      response: "Cymasphere ergänzt deine DAW durch die Generierung harmonisch solider Progressionen, Stimmführungs-Voicings und adaptiver Melodiemuster. Welche DAW verwendest du, damit ich meine Anleitung anpassen kann ?"
    },
    technical: {
      keywords: ['systemanforderungen', 'spezifikationen', 'kompatibel', 'browser', 'gerät', 'leistung'],
      response: "Cymasphere läuft als Standalone, AU (macOS) und VST3—kompatibel mit gängigen DAWs auf Mac/Windows. Welches OS und welche DAW verwendest du ?"
    }
  },
  pt: {
    smalltalk: {
      keywords: ['como vai', 'tudo bem', 'oi', 'olá', 'e aí'],
      response: "Estou ótimo e pronto para ajudar com sua música. Você está se concentrando em progressões de acordes, melodias ou arranjando uma música completa ?"
    },
    pricing: {
      keywords: ['preço', 'custo', 'preços', 'assinatura', 'plano', 'grátis', 'teste', 'dinheiro'],
      response: "Cymasphere mantém os preços simples: Mensal $6, Anual $59 (economize 25%), Vitalício $149. Qual opção se ajusta melhor à sua forma de usar Cymasphere ?"
    },
    features: {
      keywords: ['recurso', 'ferramenta', 'sintetizador', 'bateria', 'instrumento', 'efeito', 'o que pode', 'capacidades'],
      response: "Cymasphere ajuda com acordes, padrões de melodia, progressões com condução de voz e integração DAW (AU/VST3/Standalone). O que você está criando: progressões, melodias ou arranjo completo ?"
    },
    getting_started: {
      keywords: ['começar', 'iniciar', 'como', 'tutorial', 'aprender', 'novo usuário', 'primeira vez'],
      response: "Início rápido: crie uma progressão de acordes com a Paleta de Harmonia, ative o Gerador de Voicing para transições suaves, depois adicione uma melodia no Editor de Padrão Dinâmico. Você quer um guia de 3 passos para sua DAW ?"
    },
    support: {
      keywords: ['ajuda', 'suporte', 'problema', 'problema', 'bug', 'contato', 'atendimento ao cliente'],
      response: "Posso ajudar a solucionar problemas. Cymasphere inclui ajuda integrada e suporte premium. O que está te bloqueando em seu fluxo de trabalho neste momento ?"
    },
    comparison: {
      keywords: ['vs', 'comparar', 'melhor que', 'alternativa', 'concorrente', 'fl studio', 'ableton', 'logic'],
      response: "Cymasphere complementa sua DAW gerando progressões harmonicamente sólidas, voicings com condução de voz e padrões de melodia adaptativos. Qual DAW você usa para que eu possa adaptar minha orientação ?"
    },
    technical: {
      keywords: ['requisitos do sistema', 'especificações', 'compatível', 'navegador', 'dispositivo', 'desempenho'],
      response: "Cymasphere funciona como Standalone, AU (macOS) e VST3—compatível com DAWs principais em Mac/Windows. Qual SO e DAW você usa ?"
    }
  },
  ja: {
    smalltalk: {
      keywords: ['元気', 'こんにちは', 'やあ', 'おはよう', 'こんばんは'],
      response: "お疲れ様です。あなたの音楽を手伝う準備ができています。コード進行、メロディ、または完全な曲のアレンジに焦点を当てていますか ?"
    },
    pricing: {
      keywords: ['価格', 'コスト', '料金', 'サブスクリプション', 'プラン', '無料', 'トライアル', 'お金'],
      response: "Cymasphereはシンプルな価格設定です: 月額 $6、年額 $59 (25% オフ)、生涯 $149。どのオプションがあなたのCymasphere使用方法に最適ですか ?"
    },
    features: {
      keywords: ['機能', 'ツール', 'シンセサイザー', 'ドラム', '楽器', 'エフェクト', 'できる', '機能'],
      response: "Cymasphereはコード、メロディパターン、ボイスリーディング進行、DAW統合 (AU/VST3/Standalone) に対応しています。何を作成していますか: 進行、メロディ、または完全なアレンジ ?"
    },
    getting_started: {
      keywords: ['始める', '開始', 'how to', 'チュートリアル', '学ぶ', '新規ユーザー', 'はじめて'],
      response: "クイックスタート: ハーモニーパレットでコード進行を構築し、ボイシングジェネレーターでスムーズなトランジションを有効にしてから、ダイナミックパターンエディターでメロディを追加します。DAW用の3ステップガイドが必要ですか ?"
    },
    support: {
      keywords: ['助け', 'サポート', '問題', '問題', 'バグ', 'お問い合わせ', 'カスタマーサービス'],
      response: "トラブルシューティングでお手伝いします。Cymasphereには組み込みのヘルプとプレミアムサポートが含まれています。現在、ワークフロー内で何があなたをブロックしていますか ?"
    },
    comparison: {
      keywords: ['vs', '比較', 'より優れている', '代替案', '競合他社', 'fl studio', 'ableton', 'logic'],
      response: "CymasphereはあなたのDAWを補完し、調和的に健全な進行、ボイスリーディングボイシング、適応的なメロディパターンを生成します。どのDAWを使用していますか、ガイダンスを調整できるように ?"
    },
    technical: {
      keywords: ['システム要件', '仕様', '互換性', 'ブラウザ', 'デバイス', 'パフォーマンス'],
      response: "CymasphereはStandalone、AU (macOS)、VST3として実行されます。Mac/WindowsのメインDAWと互換性があります。どのOSとDAWを使用していますか ?"
    }
  },
  it: {
    smalltalk: {
      keywords: ['come stai', 'come va', 'ciao', 'eh', 'che novità'],
      response: "Sto benissimo e sono pronto ad aiutarti con la tua musica. Ti stai concentrando su progressioni di accordi, melodie o arrangiamento di una canzone completa ?"
    },
    pricing: {
      keywords: ['prezzo', 'costo', 'prezzi', 'abbonamento', 'piano', 'gratis', 'prova', 'denaro'],
      response: "Cymasphere mantiene i prezzi semplici: Mensile $6, Annuale $59 (risparmia 25%), A vita $149. Quale opzione si adatta meglio al tuo utilizzo di Cymasphere ?"
    },
    features: {
      keywords: ['caratteristica', 'strumento', 'sintetizzatore', 'batteria', 'strumento', 'effetto', 'cosa puoi', 'capacità'],
      response: "Cymasphere aiuta con accordi, schemi di melodia, progressioni con condotta vocale e integrazione DAW (AU/VST3/Standalone). Cosa stai creando: progressioni, melodie o arrangiamento completo ?"
    },
    getting_started: {
      keywords: ['iniziare', 'cominciare', 'come', 'tutorial', 'imparare', 'nuovo utente', 'prima volta'],
      response: "Avvio rapido: costruisci una progressione di accordi con la Tavolozza dell'Armonia, abilita il Generatore di Voicing per transizioni fluide, quindi aggiungi una melodia nell'Editor di Schemi Dinamici. Vuoi una guida in 3 passi per il tuo DAW ?"
    },
    support: {
      keywords: ['aiuto', 'supporto', 'problema', 'problema', 'bug', 'contatto', 'servizio clienti'],
      response: "Posso aiutarti a risolvere i problemi. Cymasphere include aiuto integrato e supporto premium. Cosa ti sta bloccando nel tuo flusso di lavoro in questo momento ?"
    },
    comparison: {
      keywords: ['vs', 'confrontare', 'migliore di', 'alternativa', 'concorrente', 'fl studio', 'ableton', 'logic'],
      response: "Cymasphere completa il tuo DAW generando progressioni armonicamente solide, voicing con condotta vocale e schemi di melodia adattivi. Quale DAW usi in modo che possa adattare la guida ?"
    },
    technical: {
      keywords: ['requisiti di sistema', 'specifiche', 'compatibile', 'browser', 'dispositivo', 'prestazioni'],
      response: "Cymasphere funziona come Standalone, AU (macOS) e VST3—compatibile con i principali DAW su Mac/Windows. Quale SO e DAW usi ?"
    }
  },
  tr: {
    smalltalk: {
      keywords: ['nasılsın', 'nasıl gidiyor', 'merhaba', 'hey', 'naber'],
      response: "Çok iyiyim ve müziğinle ilgili yardımcı olmaya hazırım. Akor ilerlemeleri, melodi mi yoksa tam bir şarkı düzenlemesi mi üzerine odaklanıyorsunuz ?"
    },
    pricing: {
      keywords: ['fiyat', 'maliyet', 'fiyatlandırma', 'abonelik', 'plan', 'ücretsiz', 'deneme', 'para'],
      response: "Cymasphere fiyatlandırmayı basit tutar: Aylık $6, Yıllık $59 (%25 tasarruf), Ömür boyu $149. Hangi seçenek Cymasphere'i nasıl kullanmayı planladığınıza en uygun ?"
    },
    features: {
      keywords: ['özellik', 'araç', 'sentezleyici', 'davul', 'enstrüman', 'efekt', 'yapabilir', 'yetenekler'],
      response: "Cymasphere akorlar, melodi desenleri, ses öncülüklü ilerlemeler ve DAW entegrasyonunda (AU/VST3/Standalone) yardımcı olur. Ne oluşturuyorsunuz: ilerlemeler, melodi mi yoksa tam düzenleme ?"
    },
    getting_started: {
      keywords: ['başla', 'başlat', 'nasıl', 'öğretici', 'öğren', 'yeni kullanıcı', 'ilk kez'],
      response: "Hızlı başlangıç: Harmoni Paletini kullanarak bir akor ilerlemesi oluşturun, yumuşak geçişler için Voicing Üretecini etkinleştirin, ardından Dinamik Desen Düzenleyicisinde bir melodi ekleyin. DAW'ınız için 3 adımlık bir rehber ister misiniz ?"
    },
    support: {
      keywords: ['yardım', 'destek', 'sorun', 'sorun', 'hata', 'iletişim', 'müşteri hizmeti'],
      response: "Sorun giderme konusunda yardımcı olabilirim. Cymasphere yerleşik yardım ve premium desteği içerir. Şu anda iş akışınızda ne sizi engelliyor ?"
    },
    comparison: {
      keywords: ['vs', 'karşılaştır', 'daha iyi', 'alternatif', 'rakip', 'fl studio', 'ableton', 'logic'],
      response: "Cymasphere, DAW'ınızı harmonik olarak sağlam ilerlemeler, ses öncülüklü voicing'ler ve uyarlanabilir melodi desenleri üreterek tamamlar. Rehberliği uyarlayabilmem için hangi DAW'ı kullanıyorsunuz ?"
    },
    technical: {
      keywords: ['sistem gereksinimleri', 'özellikler', 'uyumlu', 'tarayıcı', 'cihaz', 'performans'],
      response: "Cymasphere Standalone, AU (macOS) ve VST3 olarak çalışır—Mac/Windows'taki ana DAW'larla uyumludur. Hangi işletim sistemi ve DAW kullanıyorsunuz ?"
    }
  },
  zh: {
    smalltalk: {
      keywords: ['你好', '怎么样', '怎么了', '嗨', '你呢'],
      response: "我很好,准备好帮助您的音乐了。您是在专注于和弦进行、旋律还是编排完整的歌曲 ?"
    },
    pricing: {
      keywords: ['价格', '成本', '定价', '订阅', '计划', '免费', '试用', '钱'],
      response: "Cymasphere 保持简单的定价:月度 $6、年度 $59(节省 25%)、终身 $149。哪个选项最适合您计划使用 Cymasphere 的方式 ?"
    },
    features: {
      keywords: ['功能', '工具', '合成器', '鼓', '乐器', '效果', '能做什么', '能力'],
      response: "Cymasphere 帮助和弦、旋律模式、声部主导进行和 DAW 集成(AU/VST3/Standalone)。您在创建什么:进行、旋律还是完整的编排 ?"
    },
    getting_started: {
      keywords: ['开始', '开始', '如何', '教程', '学习', '新用户', '第一次'],
      response: "快速开始:使用和声调色板构建和弦进行,启用配音生成器以平顺过渡,然后在动态模式编辑器中添加旋律。您想要 DAW 的 3 步指南吗 ?"
    },
    support: {
      keywords: ['帮助', '支持', '问题', '问题', '错误', '联系', '客户服务'],
      response: "我可以帮助排查故障。Cymasphere 包括内置帮助和高级支持。目前什么阻碍了您的工作流程 ?"
    },
    comparison: {
      keywords: ['vs', '比较', '比...更好', '替代方案', '竞争对手', 'fl studio', 'ableton', 'logic'],
      response: "Cymasphere 通过生成和谐合理的进行、声部主导的配音和自适应旋律模式来补充您的 DAW。您使用哪个 DAW,以便我可以调整指导 ?"
    },
    technical: {
      keywords: ['系统要求', '规格', '兼容', '浏览器', '设备', '性能'],
      response: "Cymasphere 作为独立版、AU(macOS)和 VST3 运行—与 Mac/Windows 上的主要 DAW 兼容。您使用哪个操作系统和 DAW ?"
    }
  }
};

const SALES_RESPONSES: Record<string, Record<string, { keywords: string[], response: string }>> = {
  en: {
    trial: {
      keywords: ['trial', 'test', 'try', 'demo', 'sample'],
      response: "To learn about trial options, please check the Cymasphere website. What are you hoping to test out?"
    },
    upgrade: {
      keywords: ['upgrade', 'premium', 'pro', 'studio', 'paid'],
      response: "For upgrade options and premium features, please visit the pricing section on the Cymasphere website. What features are you most interested in?"
    },
    pricing_concerns: {
      keywords: ['expensive', 'cheap', 'worth', 'value', 'affordable'],
      response: "For detailed pricing and value information, please check the pricing section on the Cymasphere website. What's your budget range?"
    }
  },
  es: {
    trial: {
      keywords: ['prueba', 'probar', 'prueba', 'demostración', 'muestra'],
      response: "Para obtener más información sobre opciones de prueba, consulte el sitio web de Cymasphere. ¿Qué esperas probar ?"
    },
    upgrade: {
      keywords: ['actualizar', 'premium', 'pro', 'estudio', 'pagado'],
      response: "Para opciones de actualización y funciones premium, visite la sección de precios en el sitio web de Cymasphere. ¿Cuáles son las características que más te interesan ?"
    },
    pricing_concerns: {
      keywords: ['caro', 'barato', 'vale la pena', 'valor', 'asequible'],
      response: "Para información detallada sobre precios y valor, consulte la sección de precios en el sitio web de Cymasphere. ¿Cuál es tu rango de presupuesto ?"
    }
  },
  fr: {
    trial: {
      keywords: ['essai', 'tester', 'essayer', 'démo', 'exemple'],
      response: "Pour en savoir plus sur les options d'essai, veuillez consulter le site Web de Cymasphere. Que voulez-vous tester ?"
    },
    upgrade: {
      keywords: ['mise à niveau', 'premium', 'pro', 'studio', 'payant'],
      response: "Pour les options de mise à niveau et les fonctionnalités premium, veuillez consulter la section tarifaire du site Web de Cymasphere. Quelles fonctionnalités vous intéressent le plus ?"
    },
    pricing_concerns: {
      keywords: ['cher', 'pas cher', 'ça en va la peine', 'valeur', 'abordable'],
      response: "Pour des informations détaillées sur les tarifs et la valeur, veuillez consulter la section tarifaire du site Web de Cymasphere. Quel est votre gamme budgétaire ?"
    }
  },
  de: {
    trial: {
      keywords: ['versuch', 'testen', 'ausprobieren', 'demo', 'probe'],
      response: "Informationen zu Testoptionen finden Sie auf der Cymasphere-Website. Was möchtest du testen ?"
    },
    upgrade: {
      keywords: ['update', 'premium', 'pro', 'studio', 'bezahlt'],
      response: "Weitere Informationen zu Upgrade-Optionen und Premium-Funktionen finden Sie im Bereich Preise auf der Cymasphere-Website. Welche Funktionen interessieren dich am meisten ?"
    },
    pricing_concerns: {
      keywords: ['teuer', 'billig', 'wert', 'wert', 'erschwinglich'],
      response: "Detaillierte Informationen zu Preisen und Wert finden Sie im Bereich Preise auf der Cymasphere-Website. Was ist dein Budgetbereich ?"
    }
  },
  pt: {
    trial: {
      keywords: ['teste', 'testar', 'tentar', 'demonstração', 'amostra'],
      response: "Para saber mais sobre as opções de teste, visite o site da Cymasphere. O que você espera testar ?"
    },
    upgrade: {
      keywords: ['atualizar', 'premium', 'pro', 'estúdio', 'pago'],
      response: "Para opções de atualização e recursos premium, visite a seção de preços no site da Cymasphere. Quais recursos mais te interessam ?"
    },
    pricing_concerns: {
      keywords: ['caro', 'barato', 'vale a pena', 'valor', 'acessível'],
      response: "Para informações detalhadas sobre preços e valor, visite a seção de preços no site da Cymasphere. Qual é o seu faixa de orçamento ?"
    }
  },
  ja: {
    trial: {
      keywords: ['試用', 'テスト', 'ためす', 'デモ', 'サンプル'],
      response: "試用オプションについて詳しくは、Cymasphere ウェブサイトをご覧ください。何をテストしたいですか ?"
    },
    upgrade: {
      keywords: ['アップグレード', 'プレミアム', 'プロ', 'スタジオ', '有料'],
      response: "アップグレード オプションとプレミアム機能については、Cymasphere ウェブサイトの料金セクションをご覧ください。どの機能に最も興味がありますか ?"
    },
    pricing_concerns: {
      keywords: ['高い', '安い', '価値がある', '価値', '手頃'],
      response: "詳細な価格と価値の情報については、Cymasphere ウェブサイトの料金セクションをご覧ください。予算の範囲は ?"
    }
  },
  it: {
    trial: {
      keywords: ['prova', 'provare', 'test', 'demo', 'campione'],
      response: "Per ulteriori informazioni sulle opzioni di prova, consulta il sito Web di Cymasphere. Cosa speriamo di testare ?"
    },
    upgrade: {
      keywords: ['aggiornamento', 'premium', 'pro', 'studio', 'pagato'],
      response: "Per le opzioni di aggiornamento e le funzioni premium, consulta la sezione Prezzi nel sito Web di Cymasphere. Quali funzioni ti interessano di più ?"
    },
    pricing_concerns: {
      keywords: ['costoso', 'economico', 'ne vale la pena', 'valore', 'conveniente'],
      response: "Per informazioni dettagliate su prezzi e valore, consulta la sezione Prezzi nel sito Web di Cymasphere. Qual è il tuo intervallo di budget ?"
    }
  },
  tr: {
    trial: {
      keywords: ['deneme', 'denemek', 'test', 'demo', 'örnek'],
      response: "Deneme seçenekleri hakkında bilgi almak için lütfen Cymasphere web sitesini ziyaret edin. Ne test etmeyi umuyorsunuz ?"
    },
    upgrade: {
      keywords: ['yükseltme', 'premium', 'pro', 'stüdyo', 'ücretli'],
      response: "Yükseltme seçenekleri ve premium özellikler için lütfen Cymasphere web sitesindeki fiyatlandırma bölümünü ziyaret edin. Hangi özellikler sizi en fazla ilgilendiriyor ?"
    },
    pricing_concerns: {
      keywords: ['pahalı', 'ucuz', 'değer', 'değer', 'uygun fiyatlı'],
      response: "Fiyatlandırma ve değer hakkında ayrıntılı bilgi için lütfen Cymasphere web sitesindeki fiyatlandırma bölümünü ziyaret edin. Bütçe aralığınız nedir ?"
    }
  },
  zh: {
    trial: {
      keywords: ['试用', '测试', '尝试', '演示', '样本'],
      response: "要了解有关试用选项的信息，请访问 Cymasphere 网站。您希望测试什么 ?"
    },
    upgrade: {
      keywords: ['升级', '高级版', '专业版', '工作室', '付费'],
      response: "有关升级选项和高级功能，请访问 Cymasphere 网站上的定价部分。您对哪些功能最感兴趣 ?"
    },
    pricing_concerns: {
      keywords: ['昂贵', '便宜', '值得', '价值', '实惠'],
      response: "有关详细的定价和价值信息，请访问 Cymasphere 网站上的定价部分。您的预算范围是多少 ?"
    }
  }
};

function detectIntent(message: string, language: string = 'en'): string | null {
  const lowerMessage = message.toLowerCase();
  const faqResponses = FAQ_RESPONSES[language] || FAQ_RESPONSES['en'];
  const salesResponses = SALES_RESPONSES[language] || SALES_RESPONSES['en'];
  
  // Check for sales intents first
  for (const [intent, data] of Object.entries(salesResponses)) {
    if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return intent;
    }
  }
  
  // Then check FAQ intents
  for (const [intent, data] of Object.entries(faqResponses)) {
    if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return intent;
    }
  }
  
  return null;
}

/**
 * @brief Generates AI response using RAG (Retrieval Augmented Generation)
 * 
 * Uses a three-layer RAG system to generate context-aware responses:
 * 1. Retrieves relevant context from knowledge base
 * 2. Generates response with retrieved context
 * 3. Verifies response accuracy against context
 * 
 * Falls back to keyword-based responses if OpenAI is unavailable or RAG fails.
 * 
 * @param message User's message/query
 * @param conversationHistory Array of previous messages in the conversation
 * @param language Language code for response (default: 'en')
 * @returns AI-generated response string
 * @note Uses cymasphereRAG for context retrieval and response generation
 * @note Falls back to generateFallbackResponse if RAG fails
 * 
 * @example
 * ```typescript
 * const response = await generateAIResponse("What is Cymasphere?", [], "en");
 * // Returns: "Cymasphere is a complete song creation suite..."
 * ```
 */
async function generateAIResponse(message: string, conversationHistory: ChatMessage[], language: string = 'en'): Promise<string> {
  // Check if OpenAI is available
  if (!openai) {
    console.log('OpenAI API key not configured, using fallback responses');
    return generateFallbackResponse(message, language);
  }

  try {
    // Layer 1: RAG - Retrieve relevant context from knowledge base
    const context = await cymasphereRAG.retrieveRelevantContext(message);
    
    // Layer 2: Generate response with retrieved context
    const response = await cymasphereRAG.generateResponse(message, conversationHistory);
    
    // Layer 3: Verification - Fact-check the response against context
    const isVerified = await cymasphereRAG.verifyResponse(response, context);
    
    if (!isVerified) {
      console.log('Response failed verification, using fallback');
      return generateFallbackResponse(message, language);
    }
    
    return response;
  } catch (error) {
    console.error('RAG system error:', error);
    // Fallback to keyword-based responses if RAG fails
    return generateFallbackResponse(message, language);
  }
}

/**
 * @brief Generates fallback response using keyword matching and FAQ responses
 * 
 * Creates context-aware responses when OpenAI/RAG is unavailable by:
 * 1. Detecting user intent from message keywords
 * 2. Matching intent to multilingual FAQ responses
 * 3. Using default responses for common scenarios
 * 
 * Supports multiple languages with language-specific responses for common
 * questions about pricing, features, getting started, support, etc.
 * 
 * @param message User's message/query
 * @param language Language code for response (default: 'en')
 * @returns Fallback response string based on keywords and intent
 * @note Uses FAQ_RESPONSES and SALES_RESPONSES for keyword matching
 * @note Includes empathetic responses for common user struggles
 * 
 * @example
 * ```typescript
 * const response = generateFallbackResponse("How much does it cost?", "en");
 * // Returns: "Cymasphere keeps pricing simple—Monthly $6..."
 * ```
 */
function generateFallbackResponse(message: string, language: string = 'en'): string {
  const intent = detectIntent(message, language);
  const faqResponses = FAQ_RESPONSES[language] || FAQ_RESPONSES['en'];
  const salesResponses = SALES_RESPONSES[language] || SALES_RESPONSES['en'];
  
  if (intent && salesResponses[intent as keyof typeof salesResponses]) {
    return salesResponses[intent as keyof typeof salesResponses].response;
  }
  
  if (intent && faqResponses[intent as keyof typeof faqResponses]) {
    return faqResponses[intent as keyof typeof faqResponses].response;
  }
  
  // Default responses for common questions (NEPQ-optimized, value-weaving)
  const defaults: Record<string, Record<string, string>> = {
    en: {
      hello: "Hello! I'm here to help you explore Cymasphere—tools for harmony, melody, and arrangement that integrate with your DAW. What's the main result you're hoping to create right now?",
      what: "I'm here to help with your music. What are you working on—chord progressions, melodies, or arranging your track?",
      thanks: "You're welcome! Is there anything else I can help you with today?",
      bye: "Thanks for chatting! Feel free to come back anytime if you have more questions.",
      struggles: "I totally get that feeling - every musician has been there! The good news is that Cymasphere is designed to help you create musically satisfying results even when you're feeling stuck. It guides you toward chord progressions and melodies that work together harmonically. What's the main thing that's frustrating you right now - getting started, or feeling like your ideas don't sound right?",
      stuck: "Creative blocks are so common! Cymasphere can help break you out of that rut by suggesting new harmonic possibilities and chord progressions you might not have considered. The Harmony Palette lets you explore different musical directions visually. What type of music are you trying to create - are you working on chord progressions, melodies, or full arrangements?",
      theory: "You don't need to know music theory to use Cymasphere! That's actually one of its biggest strengths - it handles all the complex theory behind the scenes while you focus on creating. The visual interfaces help you understand musical relationships intuitively as you work. What would you like to create - chord progressions, melodies, or full songs?",
      general: "I don't know that information. Cymasphere helps producers, composers, songwriters, students, and educators with chords, melody patterns, and voice-led progressions. What feels most challenging right now—chord progressions, melodies, or arranging your song?"
    },
    es: {
      hello: "¡Hola! Estoy aquí para ayudarte a explorar Cymasphere—herramientas para armonía, melodía y arreglo que se integran con tu DAW. ¿Cuál es el resultado principal que esperas crear en este momento?",
      what: "Estoy aquí para ayudar con tu música. ¿En qué estás trabajando: progresiones de acordes, melodías o arreglando tu canción?",
      thanks: "¡De nada! ¿Hay algo más en lo que pueda ayudarte hoy?",
      bye: "¡Gracias por chatear! Siéntete libre de volver en cualquier momento si tienes más preguntas.",
      struggles: "¡Entiendo totalmente ese sentimiento! La buena noticia es que Cymasphere está diseñado para ayudarte a crear resultados musicalmente satisfactorios incluso cuando te sientes atrapado. Te guía hacia progresiones de acordes y melodías que funcionan juntas armónicamente. ¿Cuál es la principal cosa que te frustrada ahora mismo: comenzar o sentir que tus ideas no suenan bien?",
      stuck: "¡Los bloqueos creativos son muy comunes! Cymasphere puede ayudarte a salir de esa rutina sugiriendo nuevas posibilidades armónicas y progresiones de acordes que quizás no hayas considerado. La Paleta de Armonía te permite explorar visualmente diferentes direcciones musicales. ¿Qué tipo de música intentas crear: estás trabajando en progresiones, melodías o arreglos completos?",
      theory: "¡No necesitas conocer teoría musical para usar Cymasphere! Ese es en realidad uno de sus mayores fortalezas: maneja toda la teoría compleja detrás de escenas mientras tú te enfocas en crear. Las interfaces visuales te ayudan a entender las relaciones musicales intuitivamente mientras trabajas. ¿Qué te gustaría crear: progresiones de acordes, melodías o canciones completas?",
      general: "No sé esa información. Cymasphere ayuda a productores, compositores, compositores de canciones, estudiantes y educadores con acordes, patrones de melodía y progresiones con conducción de voces. ¿Qué se siente más desafiante en este momento: progresiones de acordes, melodías o arreglando tu canción?"
    },
    // Add more languages as needed, or fall back to English
  };
  
  const langDefaults = defaults[language] || defaults['en'];
  
  if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
    return langDefaults.hello;
  }
  
  const trimmed = message.trim().toLowerCase();
  if (trimmed === 'what' || trimmed === 'what?') {
    return langDefaults.what;
  }
  
  if (message.toLowerCase().includes('thank')) {
    return langDefaults.thanks;
  }
  
  if (message.toLowerCase().includes('bye') || message.toLowerCase().includes('goodbye')) {
    return langDefaults.bye;
  }
  
  if (message.toLowerCase().includes('sucks') || 
      message.toLowerCase().includes('terrible') || 
      message.toLowerCase().includes('bad at music') ||
      message.toLowerCase().includes('not good') ||
      message.toLowerCase().includes('awful')) {
    return langDefaults.struggles;
  }

  if (message.toLowerCase().includes('stuck') || 
      message.toLowerCase().includes('rut') ||
      message.toLowerCase().includes('blocked') ||
      message.toLowerCase().includes('can\'t create')) {
    return langDefaults.stuck;
  }

  if (message.toLowerCase().includes('theory') && 
      (message.toLowerCase().includes('don\'t know') || 
       message.toLowerCase().includes('confused') ||
       message.toLowerCase().includes('hard'))) {
    return langDefaults.theory;
  }

  return langDefaults.general;
}

/**
 * @brief POST endpoint to generate AI chat assistant response
 * 
 * Processes user messages and generates AI-powered responses using RAG
 * (Retrieval Augmented Generation) with fallback to keyword-based responses.
 * Supports multiple languages and maintains conversation context.
 * 
 * Request body (JSON):
 * - message: User's message/query (required)
 * - conversationHistory: Array of previous chat messages (optional)
 * - language: Language code for response - "en", "es", "fr", etc. (optional, default: "en")
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "response": "AI-generated response text",
 *   "timestamp": "2024-01-01T00:00:00.000Z",
 *   "language": "en"
 * }
 * ```
 * 
 * 400 Bad Request - Missing message:
 * ```json
 * {
 *   "error": "Message is required"
 * }
 * ```
 * 
 * 500 Internal Server Error:
 * ```json
 * {
 *   "error": "Internal server error"
 * }
 * ```
 * 
 * @param request Next.js request object containing JSON body with message and context
 * @returns NextResponse with AI-generated response or error
 * @note Uses RAG system for context-aware responses
 * @note Falls back to keyword-based responses if RAG unavailable
 * @note Supports multiple languages with language-specific responses
 * 
 * @example
 * ```typescript
 * // POST /api/chat
 * // Body: { message: "What is Cymasphere?", conversationHistory: [], language: "en" }
 * // Returns: { response: "...", timestamp: "...", language: "en" }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, conversationHistory, language } = body;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Use provided language or default to English
    const chatLanguage = language || 'en';
    console.log(`[chat-api] Processing message in language: ${chatLanguage}`);
    
    // Generate AI response
    const response = await generateAIResponse(message, conversationHistory, chatLanguage);
    
    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
      language: chatLanguage
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
