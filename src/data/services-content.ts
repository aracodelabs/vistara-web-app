export interface ServiceDetailContent {
  included: { en: string[]; ar: string[] };
  idealFor: { en: string[]; ar: string[] };
  process: { en: string[]; ar: string[] };
  faqs: {
    question: { en: string; ar: string };
    answer: { en: string; ar: string };
  }[];
}

const DEFAULT_PROCESS = {
  en: [
    "Review your property details, priority areas, and surface types via WhatsApp",
    "Confirm an itemized service scope, quotation, and preferred arrival window",
    "Arrival of our uniformed team with suitable tools and surface-safe solutions",
    "Methodical room-by-room execution followed by a quality walkthrough",
  ],
  ar: [
    "مراجعة تفاصيل العقار والمناطق ذات الأولوية ونوعية الأسطح عبر واتساب",
    "تأكيد نطاق الخدمة وعرض السعر وفترة الوصول المفضلة",
    "وصول فريقنا بالزي الرسمي مع الأدوات والمحاليل الملائمة للأسطح",
    "تنفيذ منظم خطوة بخطوة مع مراجعة نهائية للجودة قبل التسليم",
  ],
};

export const SERVICE_DETAIL_CONTENT: Record<string, ServiceDetailContent> = {
  "villa-cleaning": {
    included: {
      en: [
        "Dusting and polishing of marble, travertine, porcelain, and timber floors",
        "Formal majlis, family living room, and dining room detailing",
        "Interior glass doors, window tracks, skirting boards, and balustrades",
        "Kitchen countertop, cabinetry front, and appliance exterior wiping",
        "Bathroom fixture sanitization, mirrors, and glass shower enclosures",
        "Bedroom surface dusting, wardrobe exteriors, and terrace sweep-down",
      ],
      ar: [
        "إزالة الغبار وتلميع أرضيات الرخام والترافرتين والبورسلان والخشب",
        "العناية التفصيلية بالمجالس الرسمية وغرف المعيشة والطعام",
        "تنظيف الأبواب الزجاجية ومجاري النوافذ والنعال والدرابزين",
        "تنظيف أسطح المطبخ وواجهات الخزائن والأجهزة من الخارج",
        "تعقيم تجهيزات الحمامات والمرايا وكبائن الاستحمام الزجاجية",
        "تنظيف غرف النوم وواجهات الخزائن وتنظيف الشرفات والمداخل",
      ],
    },
    idealFor: {
      en: [
        "Standalone & compound villas in Doha, Al Rayyan, Lusail, and Al Wakrah",
        "Pre-gathering preparation before family occasions or guests",
        "Scheduled weekly or bi-weekly household upkeep",
      ],
      ar: [
        "الفلل المستقلة وفلل المجمعات في الدوحة والريان ولوسيل والوكرة",
        "التجهيز قبل المناسبات العائلية واستقبال الضيوف",
        "الصيانة المنزلية المجدولة أسبوعياً أو كل أسبوعين",
      ],
    },
    process: DEFAULT_PROCESS,
    faqs: [
      {
        question: {
          en: "Can we focus on specific floors or only the majlis and guest areas?",
          ar: "هل يمكن التركيز على طوابق محددة أو على المجلس ومناطق الضيوف فقط؟",
        },
        answer: {
          en: "Yes. Share which zones of your villa need attention on WhatsApp so we tailor the team size and scope accurately.",
          ar: "نعم، شاركنا عبر واتساب الأجزاء التي تحتاج إلى عناية في الفيلا لنخصص حجم الفريق ونطاق العمل بدقة.",
        },
      },
    ],
  },
  "apartment-cleaning": {
    included: {
      en: [
        "Living area, dining space, and balcony glass/railing cleaning",
        "Hardwood, marble, and tiled floor vacuuming and damp mopping",
        "Kitchen countertops, sink, backsplash, and cabinet exterior care",
        "Bathroom sanitization, mirror polishing, and chrome detailing",
        "Bedroom surface care, wardrobe doors, and interior glass wiping",
      ],
      ar: [
        "تنظيف منطقة المعيشة والطعام وزجاج ودرابزين الشرفات",
        "شفط ومسح الأرضيات الخشبية والرخامية والسيراميك",
        "العناية بأسطح المطبخ والحوض والسيراميك الخلفي وواجهات الخزائن",
        "تعقيم الحمامات وتلميع المرايا وتجهيزات الكروم",
        "تنظيف أسطح غرف النوم وأبواب الخزائن والزجاج الداخلي",
      ],
    },
    idealFor: {
      en: [
        "High-rise apartments and penthouses in The Pearl-Qatar, West Bay, and Lusail",
        "Busy professionals and families seeking consistent apartment care",
        "Refreshing furnished apartments between stays",
      ],
      ar: [
        "الشقق السكنية والبنتهاوس في اللؤلؤة قطر والخليج الغربي ولوسيل",
        "العائلات والمقيمين الباحثين عن عناية منزلية منتظمة",
        "تجهيز وتجديد نظافة الشقق المفروشة",
      ],
    },
    process: DEFAULT_PROCESS,
    faqs: [
      {
        question: {
          en: "Do you coordinate tower security or concierge access requirements?",
          ar: "هل تنسقون مع متطلبات أمن الأبراج السكنية وتصاريح الدخول؟",
        },
        answer: {
          en: "Yes, let us know your building's gate pass or service lift rules via WhatsApp so our team arrives prepared.",
          ar: "نعم، أبلغنا عبر واتساب بمتطلبات تصريح الدخول أو مصعد الخدمات في البرج ليصل فريقنا مستعداً.",
        },
      },
    ],
  },
  "residential-cleaning": {
    included: {
      en: [
        "Room-by-room dusting of furniture, shelves, lighting fixtures, and sills",
        "Floor vacuuming and surface-appropriate mopping across all rooms",
        "Kitchen surface wiping, sink sanitization, and appliance exteriors",
        "Bathroom cleaning, descaling of fixtures, and mirror polishing",
        "Linen straightening and waste bin emptying with liner replacement",
      ],
      ar: [
        "إزالة الغبار غرفة بغرفة للأثاث والرفوف ووحدات الإضاءة وحواف النوافذ",
        "شفط ومسح جميع الأرضيات بمحاليل مناسبة لكل سطح",
        "مسح أسطح المطبخ وتعقيم الحوض وتنظيف الأجهزة من الخارج",
        "تنظيف الحمامات وإزالة الترسبات وتلميع المرايا",
        "ترتيب الأسرّة وتفريغ سلال المهملات وتبديل الأكياس",
      ],
    },
    idealFor: {
      en: [
        "Villas, townhouses, duplexes, and apartments across Qatar",
        "One-time refresh visits or ongoing scheduled household support",
      ],
      ar: [
        "الفلل والتاون هاوس والدوبلكس والشقق في مختلف مناطق قطر",
        "زيارات التنظيف الفردية أو برامج العناية المنزلية الدورية",
      ],
    },
    process: DEFAULT_PROCESS,
    faqs: [],
  },
  "commercial-cleaning": {
    included: {
      en: [
        "Lobby, reception, and visitor lounge presentation care",
        "Glass partitions, entry doors, and corridor surface wiping",
        "Executive offices, meeting rooms, and shared workstation dusting",
        "Staff pantry surface sanitization and washroom upkeep",
        "Floor polishing, vacuuming, and scheduled waste collection",
      ],
      ar: [
        "العناية بمظهر البهو ومناطق الاستقبال وصالات الزوار",
        "تنظيف الفواصل الزجاجية وأبواب الدخول وأسطح الممرات",
        "تنظيف المكاتب التنفيذية وقاعات الاجتماعات ومحطات العمل",
        "تعقيم مطبخ الموظفين والعناية المستمرة بدورات المياه",
        "تلميع وشفط الأرضيات وجمع النفايات بشكل منظم",
      ],
    },
    idealFor: {
      en: [
        "Corporate offices, clinics, showrooms, and commercial facilities in Doha & Lusail",
        "Early-morning or post-business-hours cleaning schedules",
      ],
      ar: [
        "الشركات والعيادات وصالات العرض والمباني التجارية في الدوحة ولوسيل",
        "الجداول الصباحية المبكرة أو بعد انتهاء ساعات العمل",
      ],
    },
    process: DEFAULT_PROCESS,
    faqs: [],
  },
  "office-cleaning": {
    included: {
      en: [
        "Desk surfaces, monitor stands, conference tables, and seating dusting",
        "Frameless glass office walls, doors, and handle sanitization",
        "Reception desks, waiting areas, and executive suites",
        "Pantry counters, coffee stations, and shared washroom sanitization",
        "Carpeted and hard-surface floor care across work zones",
      ],
      ar: [
        "تنظيف المكاتب وطاولات الاجتماعات والكراسي وإزالة الغبار",
        "تنظيف الجدران والأبواب الزجاجية وتعقيم المقابض",
        "العناية بمكاتب الاستقبال ومناطق الانتظار والأجنحة التنفيذية",
        "تعقيم منطقة القهوة والمطبخ المكتبي ودورات المياه المشتركة",
        "العناية بالأرضيات الصلبة والسجاد في مساحات العمل",
      ],
    },
    idealFor: {
      en: [
        "West Bay towers, Lusail Marina corporate floors, and business centers",
        "Before client board meetings or regular weekly office maintenance",
      ],
      ar: [
        "أبراج الخليج الغربي ومكاتب مرسى لوسيل ومراكز الأعمال",
        "قبل اجتماعات مجلس الإدارة أو ضمن عقود صيانة المكاتب الدورية",
      ],
    },
    process: DEFAULT_PROCESS,
    faqs: [],
  },
  "deep-cleaning": {
    included: {
      en: [
        "Detailed high-to-low cleaning of vents, light fittings, walls, and cornices",
        "Cabinet interiors/exteriors, drawers, window frames, and sliding tracks",
        "Intensive kitchen degreasing and bathroom grout/scale detailing",
        "Behind-and-under movable furniture vacuuming and floor scrubbing",
        "Switches, door frames, baseboards, and high-touch point sanitization",
      ],
      ar: [
        "تنظيف تفصيلي من الأعلى للأسفل لفتحات التكييف والإنارة والجدران والكرانيش",
        "تنظيف الخزائن من الداخل والخارج وإطارات النوافذ ومجاري السحب",
        "إزالة الدهون العميقة في المطابخ وتنظيف الفواصل والترسبات في الحمامات",
        "التنظيف خلف وتحت الأثاث القابل للتحريك وفرك الأرضيات",
        "تعقيم مفاتيح الكهرباء وإطارات الأبواب والنعال ونقاط اللمس",
      ],
    },
    idealFor: {
      en: [
        "Seasonal home refreshes, Ramadan & Eid preparation, and post-renovation cleanup",
        "Properties returning to full use after travel or dusty weather",
      ],
      ar: [
        "التجديد الموسمي للمنازل والاستعداد لرمضان والأعياد وتنظيف ما بعد الصيانة",
        "العقارات العائدة للاستخدام بعد السفر أو موجات الغبار",
      ],
    },
    process: DEFAULT_PROCESS,
    faqs: [],
  },
  "sofa-cleaning": {
    included: {
      en: [
        "Fabric assessment to match moisture and cleaning solution safely",
        "Deep dry vacuuming to remove embedded sand, dust, and allergens",
        "Targeted pre-treatment on armrests, headrests, and visible spots",
        "Hot-water extraction or low-moisture steam care depending on upholstery",
        "Deodorizing finish and airflow guidance for smooth drying",
      ],
      ar: [
        "فحص نوع القماش لاختيار درجة الرطوبة والمحلول المناسب بأمان",
        "شفط جاف عميق لإزالة الرمال والغبار ومسببات الحساسية العالقة",
        "معالجة أولية للبقع الظاهرة ومساند اليد والرأس",
        "تنظيف بالاستخراج أو البخار منخفض الرطوبة حسب نوع التنجيد",
        "تعطير لطيف وإرشادات تهوية لضمان جفاف مثالي",
      ],
    },
    idealFor: {
      en: [
        "Traditional Qatari majlis seating, linen sectionals, and velvet sofas",
        "Dining chairs, ottomans, and upholstered lounge suites",
      ],
      ar: [
        "المجالس القطرية والكنب الكتاني والمخملي والزاوية",
        "كراسي الطعام والأرائك والمفروشات المنجدة",
      ],
    },
    process: DEFAULT_PROCESS,
    faqs: [],
  },
  "carpet-cleaning": {
    included: {
      en: [
        "High-filtration vacuuming to extract fine desert dust from deep pile",
        "Spot treatment for beverage spills and high-traffic walkways",
        "Controlled extraction washing with fiber-safe neutral conditioners",
        "Edge, fringe, and backing care to preserve shape and weave",
      ],
      ar: [
        "شفط عالي الترشيح لاستخراج الغبار الناعم من أعماق الوبر",
        "معالجة مخصصة لبقع المشروبات وممرات الحركة الكثيفة",
        "غسيل بالاستخراج مع ملطفات متوازنة وآمنة على الألياف",
        "عناية خاصة بالحواف والأطراف للحفاظ على نسيج السجاد",
      ],
    },
    idealFor: {
      en: [
        "Living room wool/silk-blend area rugs, majlis carpets, and office carpeting",
        "Seasonal dust and allergen removal",
      ],
      ar: [
        "سجاد الصالات الفاخر وسجاد المجالس وموكيت المكاتب",
        "إزالة الغبار الموسمي ومسببات الحساسية",
      ],
    },
    process: DEFAULT_PROCESS,
    faqs: [],
  },
  "mattress-cleaning": {
    included: {
      en: [
        "Multi-pass high-suction vacuuming of both mattress faces and seams",
        "Steam sanitization to target dust mites, bacteria, and stale odors",
        "Gentle spot lifting without oversaturating foam or natural layers",
        "Bed frame and upholstered headboard dusting",
      ],
      ar: [
        "شفط عميق متعدد المراحل لسطحي المرتبة والحواف والدرزات",
        "تعقيم بالبخار لاستهداف عث الغبار والبكتيريا والروائح",
        "معالجة لطيفة للبقع دون إشباع الطبقات الداخلية بالرطوبة",
        "تنظيف هيكل السرير واللوح الخلفي المنجد",
      ],
    },
    idealFor: {
      en: [
        "Master suites, family bedrooms, guest bedrooms, and serviced residences",
        "Households prioritizing allergen reduction and sleep hygiene",
      ],
      ar: [
        "غرف النوم الرئيسية وغرف العائلة والضيوف والشقق الفندقية",
        "الأسر المهتمة بتقليل مسببات الحساسية ونظافة بيئة النوم",
      ],
    },
    process: DEFAULT_PROCESS,
    faqs: [],
  },
  "curtain-cleaning": {
    included: {
      en: [
        "Soft-brush vacuuming along folds, headings, and pelmets",
        "In-situ dry steam sanitization while curtains remain hung",
        "Odor refreshment and crease relaxation for sheers and blackout drapes",
        "Window sill and curtain track dust wiping",
      ],
      ar: [
        "شفط لطيف بفرشاة ناعمة على طول الطيات والأطراف العلوية",
        "تعقيم بالبخار الجاف في المكان دون الحاجة لفك الستائر",
        "إنعاش الأقمشة وإزالة الروائح للستائر الشفافة والمعتمة",
        "مسح حواف النوافذ وقضبان ومجاري الستائر من الغبار",
      ],
    },
    idealFor: {
      en: [
        "Double-height villa drapes, majlis curtains, and sheer window panels",
        "Refreshing interiors without removing heavy custom drapery",
      ],
      ar: [
        "ستائر الفلل مزدوجة الارتفاع وستائر المجالس والستائر الشفافة",
        "تنظيف الستائر الثقيلة والمفصلة دون عناء الفك والتركيب",
      ],
    },
    process: DEFAULT_PROCESS,
    faqs: [],
  },
  "water-tank-cleaning": {
    included: {
      en: [
        "Controlled draining of overhead or underground residential/commercial tanks",
        "Removal of settled silt, sand, and biofilm deposits",
        "Manual scrubbing and pressure rinsing of interior tank walls and base",
        "Hygienic sanitization rinse and visual inspection of tank lid and seals",
      ],
      ar: [
        "تفريغ منظم لخزانات المياه العلوية أو الأرضية السكنية والتجارية",
        "إزالة الرواسب الرملية والطمي والتراكمات من القاع",
        "تنظيف وفرك يدوي وشطف بالضغط للجدران الداخلية وأرضية الخزان",
        "شطف وتعقيم صحي وفحص ظاهري لغطاء الخزان وعزله",
      ],
    },
    idealFor: {
      en: [
        "Private villas, residential compounds, and commercial buildings in Qatar",
        "Periodic annual or semi-annual water hygiene maintenance",
      ],
      ar: [
        "الفلل الخاصة والمجمعات السكنية والمباني التجارية في قطر",
        "الصيانة الدورية السنوية أو نصف السنوية لنظافة المياه",
      ],
    },
    process: DEFAULT_PROCESS,
    faqs: [],
  },
  "kitchen-cleaning": {
    included: {
      en: [
        "Degreasing of range hoods, filters, stovetops, and backsplash tiles",
        "Calacatta marble, quartz, and granite island cleaning with stone-safe care",
        "Cabinet exterior degreasing, handles, and kickboards",
        "Sink, faucet descaling, and appliance exterior polishing",
      ],
      ar: [
        "إزالة الدهون من الشفاطات والفلاتر والمواقد وبلاط الجدران",
        "تنظيف جزر الرخام والكوارتز والجرانيت بمواد آمنة على الحجر",
        "تنظيف واجهات الخزائن والمقابض والنعال السفلية من الدهون",
        "إزالة الترسبات عن الأحواض والخلاطات وتلميع الأجهزة من الخارج",
      ],
    },
    idealFor: {
      en: [
        "Show kitchens and working dirty kitchens in Qatar villas",
        "Post-hosting cleanup and periodic degreasing maintenance",
      ],
      ar: [
        "المطابخ الرئيسية ومطابخ التحضير في الفلل القطرية",
        "تنظيف ما بعد الولائم والعزائم والصيانة الدورية لإزالة الدهون",
      ],
    },
    process: DEFAULT_PROCESS,
    faqs: [],
  },
  "bathroom-cleaning": {
    included: {
      en: [
        "Descaling of glass shower enclosures, rain heads, and chrome/brass mixers",
        "Tile and grout detailing across shower walls and vanity surrounds",
        "Sanitization of toilets, bidets, bathtubs, and marble vanity tops",
        "Mirror, exhaust vent exterior, and accessory polishing",
      ],
      ar: [
        "إزالة الترسبات الكلسية عن زجاج الاستحمام والخلاطات",
        "تنظيف دقيق لبلاط الجدران وفواصل الترويبة وحول المغاسل",
        "تعقيم المراحيض والأحواض وأسطح المغاسل الرخامية",
        "تلميع المرايا وأغطية مراوح الشفط والإكسسوارات",
      ],
    },
    idealFor: {
      en: [
        "En-suite stone bathrooms, guest powder rooms, and office washrooms",
        "Restoring bright, streak-free glass and scale-free fixtures",
      ],
      ar: [
        "حمامات الأجنحة الحجرية وحمامات الضيوف ودورات المياه المكتبية",
        "استعادة لمعان الزجاج وخلو التجهيزات من التكلسات",
      ],
    },
    process: DEFAULT_PROCESS,
    faqs: [],
  },
  "move-in-move-out-cleaning": {
    included: {
      en: [
        "Empty-property deep clean of every room, wardrobe interior, and shelf",
        "Window frames, sliding door tracks, glass panels, and balcony wash",
        "Kitchen cupboard interiors, counters, hood, and sink sanitization",
        "Bathroom descaling and floor scrubbing ready for immediate handover",
      ],
      ar: [
        "تنظيف عميق وشامل للعقار الفارغ بما في ذلك الخزائن والرفوف من الداخل",
        "تنظيف إطارات النوافذ ومجاري الأبواب والزجاج وغسل الشرفات",
        "تعقيم خزائن المطبخ من الداخل والأسطح والشفاط والأحواض",
        "إزالة تكلسات الحمامات وفرك الأرضيات لتكون جاهزة للسكن الفوري",
      ],
    },
    idealFor: {
      en: [
        "Tenants completing lease handovers in Doha, The Pearl, and Lusail",
        "Homeowners preparing a newly purchased or newly leased residence",
      ],
      ar: [
        "المستأجرين عند تسليم العقار في الدوحة واللؤلؤة ولوسيل",
        "الملاك والمنتقلين الجدد لتجهيز المسكن قبل الأثاث",
      ],
    },
    process: DEFAULT_PROCESS,
    faqs: [],
  },
};
