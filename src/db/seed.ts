import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { serviceCategories, services } from "./schema";

const CATEGORIES_SEED = [
  {
    slug: "residential",
    name_en: "Residential Cleaning",
    name_ar: "خدمات التنظيف السكني",
    description_en:
      "Tailored home care for luxury villas, modern apartments, and private residences across Qatar.",
    description_ar:
      "عناية منزلية مخصصة للفلل الفاخرة والشقق الحديثة والمساكن الخاصة في جميع أنحاء قطر.",
    is_active: true,
  },
  {
    slug: "commercial",
    name_en: "Commercial Cleaning",
    name_ar: "خدمات التنظيف التجاري",
    description_en:
      "Discreet, reliable hygiene standards for offices, corporate suites, and commercial premises.",
    description_ar:
      "معايير نظافة موثوقة وراقية للمكاتب والأجنحة التنفيذية والمباني التجارية.",
    is_active: true,
  },
  {
    slug: "specialized",
    name_en: "Specialized & Deep Care",
    name_ar: "التنظيف العميق والعناية المتخصصة",
    description_en:
      "Targeted deep sanitization, upholstery, carpet, mattress, curtain, kitchen, bathroom, and water tank care.",
    description_ar:
      "تعقيم عميق وعناية متخصصة بالمفروشات والسجاد والمراتب والستائر والمطابخ والحمامات وخزانات المياه.",
    is_active: true,
  },
];

const SERVICES_SEED = [
  {
    slug: "villa-cleaning",
    category: "residential",
    title_en: "Villa Cleaning",
    title_ar: "تنظيف الفلل",
    description_en:
      "Comprehensive interior and courtyard care designed for multi-level villas, majlis areas, marble foyers, and private residences in Doha, Lusail, and Al Rayyan.",
    description_ar:
      "عناية شاملة بالمساحات الداخلية والفناء الخارجي مصممة للفلل متعددة الطوابق والمجالس والمداخل الرخامية في الدوحة ولوسيل والريان.",
    image: "/images/hero-villa.jpg",
    sort_order: 1,
  },
  {
    slug: "apartment-cleaning",
    category: "residential",
    title_en: "Apartment Cleaning",
    title_ar: "تنظيف الشقق",
    description_en:
      "Meticulous upkeep for apartments and penthouses in The Pearl-Qatar, West Bay, and Lusail, respecting refined finishes and busy household schedules.",
    description_ar:
      "تنظيف دقيق للشقق والبنتهاوس في اللؤلؤة والخليج الغربي ولوسيل مع مراعاة التشطيبات الراقية ومواعيد الأسرة.",
    image: "/images/service-apartment.jpg",
    sort_order: 2,
  },
  {
    slug: "residential-cleaning",
    category: "residential",
    title_en: "Residential Cleaning",
    title_ar: "التنظيف السكني الشامل",
    description_en:
      "Flexible scheduled and on-demand residential cleaning tailored to preserve comfort, freshness, and surface longevity throughout your home.",
    description_ar:
      "خدمات تنظيف سكني مرنة مجدولة أو حسب الطلب مصممة للحفاظ على الراحة والانتعاش وجودة الأسطح في منزلك.",
    image: "/images/about-team.jpg",
    sort_order: 3,
  },
  {
    slug: "commercial-cleaning",
    category: "commercial",
    title_en: "Commercial Cleaning",
    title_ar: "التنظيف التجاري",
    description_en:
      "Structured facility hygiene for commercial buildings, showrooms, clinics, and hospitality lounges arranged around your operating hours.",
    description_ar:
      "نظافة مؤسسية منظمة للمباني التجارية وصالات العرض والعيادات وصالات الضيافة وفق ساعات عملكم.",
    image: "/images/service-office.jpg",
    sort_order: 4,
  },
  {
    slug: "office-cleaning",
    category: "commercial",
    title_en: "Office Cleaning",
    title_ar: "تنظيف المكاتب",
    description_en:
      "Consistent workplace care covering workstations, glass boardrooms, executive suites, pantries, and reception spaces across Doha business districts.",
    description_ar:
      "عناية مستمرة ببيئة العمل تشمل مكاتب الموظفين وقاعات الاجتماعات الزجاجية والأجنحة التنفيذية ومناطق الاستقبال في الدوحة.",
    image: "/images/service-office.jpg",
    sort_order: 5,
  },
  {
    slug: "deep-cleaning",
    category: "specialized",
    title_en: "Deep Cleaning",
    title_ar: "التنظيف العميق",
    description_en:
      "Top-to-bottom intensive cleaning reaching concealed corners, skirting, cabinetry, fixtures, and high-touch surfaces for seasonal refreshes or post-renovation care.",
    description_ar:
      "تنظيف مكثف وشامل من السقف إلى الأرض يصل إلى الزوايا المخفية والنعال والخزائن والتجهيزات والأسطح عالية اللمس.",
    image: "/images/hero-villa.jpg",
    sort_order: 6,
  },
  {
    slug: "sofa-cleaning",
    category: "specialized",
    title_en: "Sofa Cleaning",
    title_ar: "تنظيف الكنب والمجالس",
    description_en:
      "Gentle fabric-safe extraction and steam care for luxury sofas, Qatari majlis seating, and upholstered lounges to lift dust, odors, and surface stains.",
    description_ar:
      "تنظيف لطيف وآمن للأقمشة بالبخار والاستخراج للكنب الفاخر والمجالس القطرية لإزالة الغبار والروائح والبقع السطحية.",
    image: "/images/service-sofa.jpg",
    sort_order: 7,
  },
  {
    slug: "carpet-cleaning",
    category: "specialized",
    title_en: "Carpet Cleaning",
    title_ar: "تنظيف السجاد والموكيت",
    description_en:
      "Deep fiber cleaning and gentle conditioning for fitted carpets and fine area rugs, restoring texture and freshness without harsh residue.",
    description_ar:
      "تنظيف عميق لألياف السجاد والموكيت الفاخر يعيد النعومة والانتعاش دون ترك بقايا قاسية.",
    image: "/images/service-sofa.jpg",
    sort_order: 8,
  },
  {
    slug: "mattress-cleaning",
    category: "specialized",
    title_en: "Mattress Cleaning",
    title_ar: "تنظيف وتعقيم المراتب",
    description_en:
      "Hygienic deep vacuuming and low-moisture sanitization designed to remove dust mites, allergens, and stale odors from residential mattresses.",
    description_ar:
      "شفط عميق وتعقيم قليل الرطوبة لإزالة عث الغبار ومسببات الحساسية والروائح من مراتب النوم.",
    image: "/images/service-apartment.jpg",
    sort_order: 9,
  },
  {
    slug: "curtain-cleaning",
    category: "specialized",
    title_en: "Curtain Cleaning",
    title_ar: "تنظيف الستائر",
    description_en:
      "Careful in-place steaming and dust extraction for sheer drapes, blackout panels, and formal majlis curtains without disrupting delicate pleats.",
    description_ar:
      "تنظيف بالبخار وشفط الغبار للستائر الشفافة والمعتمة وستائر المجالس الرسمية في مكانها دون الإضرار بثنياتها الدقيقة.",
    image: "/images/service-apartment.jpg",
    sort_order: 10,
  },
  {
    slug: "water-tank-cleaning",
    category: "specialized",
    title_en: "Water Tank Cleaning",
    title_ar: "تنظيف وتعقيم خزانات المياه",
    description_en:
      "Thorough draining, sediment removal, interior scrubbing, and hygienic rinsing for residential and commercial overhead and underground water tanks in Qatar.",
    description_ar:
      "تفريغ شامل وإزالة الرواسب وتنظيف الجدران الداخلية وشطف صحي لخزانات المياه العلوية والأرضية السكنية والتجارية في قطر.",
    image: "/images/about-team.jpg",
    sort_order: 11,
  },
  {
    slug: "kitchen-cleaning",
    category: "specialized",
    title_en: "Kitchen Cleaning",
    title_ar: "تنظيف المطابخ",
    description_en:
      "Detailed degreasing and sanitization of marble islands, cabinet exteriors, range hoods, cooktops, sinks, and preparation zones.",
    description_ar:
      "إزالة دقيقة للدهون وتعقيم لجزر الرخام والخزائن والشفاطات والمواقد والأحواض ومناطق تحضير الطعام.",
    image: "/images/service-kitchen.jpg",
    sort_order: 12,
  },
  {
    slug: "bathroom-cleaning",
    category: "specialized",
    title_en: "Bathroom Cleaning",
    title_ar: "تنظيف وتعقيم الحمامات",
    description_en:
      "Hospitality-grade descaling, tile and grout detailing, glass enclosure polishing, and fixture sanitization for spotless, fresh bathrooms.",
    description_ar:
      "إزالة الترسبات الكلسية وتنظيف الفواصل وتلميع الزجاج وتعقيم التجهيزات بمعايير فندقية راقية.",
    image: "/images/service-kitchen.jpg",
    sort_order: 13,
  },
  {
    slug: "move-in-move-out-cleaning",
    category: "residential",
    title_en: "Move-In / Move-Out Cleaning",
    title_ar: "تنظيف ما قبل الانتقال وما بعد المغادرة",
    description_en:
      "Complete handover-ready cleaning for empty villas, apartments, and offices so new residents or tenants step into an immaculate space.",
    description_ar:
      "تنظيف شامل جاهز للتسليم للفلل والشقق والمكاتب الفارغة ليبدأ السكان أو المستأجرون في مساحة مثالية النظافة.",
    image: "/images/hero-villa.jpg",
    sort_order: 14,
  },
];

export async function seedDatabase() {
  const db = getDb();

  const categoryIdBySlug = new Map<string, number>();

  for (const cat of CATEGORIES_SEED) {
    const existing = await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.slug, cat.slug))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(serviceCategories)
        .set({
          name_en: cat.name_en,
          name_ar: cat.name_ar,
          description_en: cat.description_en,
          description_ar: cat.description_ar,
          is_active: cat.is_active,
        })
        .where(eq(serviceCategories.id, existing[0].id));
      categoryIdBySlug.set(cat.slug, existing[0].id);
    } else {
      const [inserted] = await db
        .insert(serviceCategories)
        .values(cat)
        .returning({ id: serviceCategories.id });
      categoryIdBySlug.set(cat.slug, inserted.id);
    }
  }

  for (const svc of SERVICES_SEED) {
    const categoryId = categoryIdBySlug.get(svc.category) ?? null;
    const existing = await db
      .select()
      .from(services)
      .where(eq(services.slug, svc.slug))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(services)
        .set({
          category: svc.category,
          category_id: categoryId,
          title_en: svc.title_en,
          title_ar: svc.title_ar,
          description_en: svc.description_en,
          description_ar: svc.description_ar,
          image: svc.image,
          sort_order: svc.sort_order,
          is_active: true,
          updated_at: new Date(),
        })
        .where(eq(services.id, existing[0].id));
    } else {
      await db.insert(services).values({
        ...svc,
        category_id: categoryId,
        is_active: true,
      });
    }
  }

  console.log(
    `Seeded ${CATEGORIES_SEED.length} categories and ${SERVICES_SEED.length} services into Neon PostgreSQL.`
  );
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Failed to seed database:", err);
      process.exit(1);
    });
}
