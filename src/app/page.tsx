"use client";

import { useMemo, useState } from "react";

type Screen = "home" | "items" | "pickup" | "review" | "payment" | "confirmation" | "tracking";
type Item = { name: string; quantity: number };

const ITEM_TYPES = ["ثوب", "قميص", "بنطال", "عباءة", "فستان", "بطانية"];
const steps: Array<{ id: Screen; label: string }> = [
  { id: "items", label: "القطع" }, { id: "pickup", label: "الاستلام" },
  { id: "review", label: "المراجعة" }, { id: "payment", label: "الدفع" },
  { id: "confirmation", label: "التأكيد" },
];

export default function CustomerPage() {
  const [screen, setScreen] = useState<Screen>("home");
  const [items, setItems] = useState<Item[]>([]);
  const [customItem, setCustomItem] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupAt, setPickupAt] = useState("");
  const [receiptMethod, setReceiptMethod] = useState<"branch_pickup" | "home_delivery">("branch_pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryAt, setDeliveryAt] = useState("");
  const [error, setError] = useState("");
  const currentStep = steps.findIndex((step) => step.id === screen);
  const totalPieces = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  function go(next: Screen) {
    setError(""); setScreen(next); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function changeQuantity(name: string, amount: number) {
    setItems((current) => {
      const existing = current.find((item) => item.name === name);
      if (!existing && amount > 0) return [...current, { name, quantity: 1 }];
      return current.map((item) => item.name === name ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0);
    });
  }
  function addCustomItem() {
    const name = customItem.trim();
    if (!name) return setError("اكتب اسم القطعة الأخرى أولًا.");
    changeQuantity(name, 1); setCustomItem(""); setError("");
  }
  function continueFromItems() {
    if (!items.length) return setError("اختر قطعة واحدة على الأقل للمتابعة.");
    go("pickup");
  }
  function continueFromPickup() {
    if (!pickupAddress.trim() || !pickupAt) return setError("أدخل عنوان وموعد استلام الملابس.");
    if (receiptMethod === "home_delivery" && (!deliveryAddress.trim() || !deliveryAt)) return setError("أدخل عنوان وموعد توصيل الملابس.");
    go("review");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => go("home")} aria-label="العودة للرئيسية">
          <span className="brand-mark" aria-hidden="true">م</span>
          <span><strong>مغسلتك</strong><small>عناية تبدأ من بابك</small></span>
        </button>
        {screen !== "home" && <button className="quiet-button" onClick={() => go("home")}>الرئيسية</button>}
      </header>

      {currentStep >= 0 && <nav className="stepper" aria-label="مراحل الطلب">
        {steps.map((step, index) => <div className={index <= currentStep ? "step active" : "step"} key={step.id}><span>{index + 1}</span><small>{step.label}</small></div>)}
      </nav>}

      <section className="screen" key={screen}>
        {screen === "home" && <Home onStart={() => go("items")} onTrack={() => go("tracking")} />}
        {screen === "items" && <ItemsScreen items={items} customItem={customItem} error={error} onCustomItemChange={setCustomItem} onQuantityChange={changeQuantity} onAddCustomItem={addCustomItem} onBack={() => go("home")} onNext={continueFromItems} />}
        {screen === "pickup" && <PickupScreen pickupAddress={pickupAddress} pickupAt={pickupAt} receiptMethod={receiptMethod} deliveryAddress={deliveryAddress} deliveryAt={deliveryAt} error={error} onPickupAddressChange={setPickupAddress} onPickupAtChange={setPickupAt} onReceiptMethodChange={setReceiptMethod} onDeliveryAddressChange={setDeliveryAddress} onDeliveryAtChange={setDeliveryAt} onBack={() => go("items")} onNext={continueFromPickup} />}
        {screen === "review" && <ReviewScreen items={items} totalPieces={totalPieces} pickupAddress={pickupAddress} pickupAt={pickupAt} receiptMethod={receiptMethod} deliveryAddress={deliveryAddress} deliveryAt={deliveryAt} onEditItems={() => go("items")} onEditPickup={() => go("pickup")} onNext={() => go("payment")} />}
        {screen === "payment" && <PaymentScreen onBack={() => go("review")} onNext={() => go("confirmation")} />}
        {screen === "confirmation" && <ConfirmationScreen onHome={() => go("home")} onTrack={() => go("tracking")} />}
        {screen === "tracking" && <TrackingScreen onHome={() => go("home")} />}
      </section>
    </main>
  );
}

function Home({ onStart, onTrack }: { onStart: () => void; onTrack: () => void }) {
  return <div className="home-screen">
    <div className="hero-art" aria-hidden="true"><span className="bubble bubble-one" /><span className="bubble bubble-two" /><span className="hanger">⌁</span></div>
    <p className="eyebrow">راحة أكثر، من أول خطوة</p><h1>ملابسك نظيفة،<br />ووقتك لك.</h1>
    <p className="lead">نستلم ملابسك من المنزل، ونعتني بها حتى تصبح جاهزة بالطريقة التي تناسبك.</p>
    <div className="home-actions"><button className="primary-button" onClick={onStart}>ابدأ طلبًا جديدًا <span>←</span></button><button className="secondary-button" onClick={onTrack}>تتبع طلبك</button></div>
    <div className="promise-row"><span><b>01</b> اختر قطعك</span><span><b>02</b> حدد الموعد</span><span><b>03</b> نستلمها منك</span></div>
  </div>;
}

type ItemsProps = { items: Item[]; customItem: string; error: string; onCustomItemChange: (value: string) => void; onQuantityChange: (name: string, amount: number) => void; onAddCustomItem: () => void; onBack: () => void; onNext: () => void };
function ItemsScreen(props: ItemsProps) {
  return <div>
    <ScreenHeading number="01" title="ماذا سنستلم منك؟" subtitle="اختر القطع وحدد الكمية. ستظهر الخدمات المتاحة عند ربط النظام." />
    <div className="item-grid">{ITEM_TYPES.map((name) => {
      const quantity = props.items.find((item) => item.name === name)?.quantity ?? 0;
      return <article className={quantity ? "item-card selected" : "item-card"} key={name}><span className="item-icon" aria-hidden="true">◇</span><h3>{name}</h3><p>الخدمة تُحدد لاحقًا</p><div className="counter" aria-label={`كمية ${name}`}><button onClick={() => props.onQuantityChange(name, -1)} disabled={!quantity}>−</button><b>{quantity}</b><button onClick={() => props.onQuantityChange(name, 1)}>+</button></div></article>;
    })}</div>
    <div className="custom-card"><div><b>قطعة أخرى</b><small>اكتب اسم القطعة، ويُحدد سعرها لاحقًا.</small></div><div className="inline-field"><input value={props.customItem} onChange={(e) => props.onCustomItemChange(e.target.value)} placeholder="اسم القطعة" /><button onClick={props.onAddCustomItem}>إضافة</button></div></div>
    {props.items.filter((item) => !ITEM_TYPES.includes(item.name)).map((item) => <div className="custom-summary" key={item.name}><span>{item.name}</span><div className="counter compact"><button onClick={() => props.onQuantityChange(item.name, -1)}>−</button><b>{item.quantity}</b><button onClick={() => props.onQuantityChange(item.name, 1)}>+</button></div></div>)}
    <ErrorMessage message={props.error} /><PageActions onBack={props.onBack} onNext={props.onNext} nextLabel="العنوان والموعد" />
  </div>;
}

type PickupProps = { pickupAddress: string; pickupAt: string; receiptMethod: "branch_pickup" | "home_delivery"; deliveryAddress: string; deliveryAt: string; error: string; onPickupAddressChange: (value: string) => void; onPickupAtChange: (value: string) => void; onReceiptMethodChange: (value: "branch_pickup" | "home_delivery") => void; onDeliveryAddressChange: (value: string) => void; onDeliveryAtChange: (value: string) => void; onBack: () => void; onNext: () => void };
function PickupScreen(props: PickupProps) {
  return <div>
    <ScreenHeading number="02" title="أين ومتى نستلم؟" subtitle="أدخل تفاصيل استلام الملابس من منزلك." />
    <div className="form-card"><label>عنوان الاستلام<input value={props.pickupAddress} onChange={(e) => props.onPickupAddressChange(e.target.value)} placeholder="الحي، الشارع، رقم المبنى" /></label><label>موعد الاستلام<input type="datetime-local" value={props.pickupAt} onChange={(e) => props.onPickupAtChange(e.target.value)} /></label></div>
    <h2 className="section-title">كيف تريد استلام الملابس بعد تجهيزها؟</h2>
    <div className="choice-grid"><button className={props.receiptMethod === "branch_pickup" ? "choice selected" : "choice"} onClick={() => props.onReceiptMethodChange("branch_pickup")}><span>⌂</span><b>من المغسلة</b><small>تستلمها بنفسك عندما تصبح جاهزة</small></button><button className={props.receiptMethod === "home_delivery" ? "choice selected" : "choice"} onClick={() => props.onReceiptMethodChange("home_delivery")}><span>⌁</span><b>توصيل للمنزل</b><small>نوصلها إلى العنوان الذي تختاره</small></button></div>
    {props.receiptMethod === "home_delivery" && <div className="form-card reveal"><label>عنوان التوصيل<input value={props.deliveryAddress} onChange={(e) => props.onDeliveryAddressChange(e.target.value)} placeholder="الحي، الشارع، رقم المبنى" /></label><label>موعد التوصيل<input type="datetime-local" value={props.deliveryAt} onChange={(e) => props.onDeliveryAtChange(e.target.value)} /></label></div>}
    <ErrorMessage message={props.error} /><PageActions onBack={props.onBack} onNext={props.onNext} nextLabel="مراجعة الطلب" />
  </div>;
}

type ReviewProps = { items: Item[]; totalPieces: number; pickupAddress: string; pickupAt: string; receiptMethod: "branch_pickup" | "home_delivery"; deliveryAddress: string; deliveryAt: string; onEditItems: () => void; onEditPickup: () => void; onNext: () => void };
function ReviewScreen(props: ReviewProps) {
  return <div>
    <ScreenHeading number="03" title="راجع طلبك" subtitle="تأكد من التفاصيل قبل الانتقال إلى الدفع." />
    <section className="review-card"><div className="review-head"><div><span>القطع</span><b>{props.totalPieces} قطعة</b></div><button onClick={props.onEditItems}>تعديل</button></div><ul>{props.items.map((item) => <li key={item.name}><span>{item.name}</span><b>× {item.quantity}</b></li>)}</ul><p className="muted-note">الخدمات والأسعار ستظهر بعد ربط بيانات النظام.</p></section>
    <section className="review-card"><div className="review-head"><div><span>الاستلام من المنزل</span><b>{formatDate(props.pickupAt)}</b></div><button onClick={props.onEditPickup}>تعديل</button></div><p>{props.pickupAddress}</p></section>
    <section className="review-card"><div className="review-head"><div><span>استلام الطلب بعد التجهيز</span><b>{props.receiptMethod === "branch_pickup" ? "من المغسلة" : "توصيل للمنزل"}</b></div></div>{props.receiptMethod === "home_delivery" && <p>{props.deliveryAddress}<br />{formatDate(props.deliveryAt)}</p>}</section>
    <PageActions onBack={props.onEditPickup} onNext={props.onNext} nextLabel="المتابعة إلى الدفع" />
  </div>;
}

function PaymentScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return <div><ScreenHeading number="04" title="الدفع" subtitle="سيظهر المبلغ وطريقة الدفع بعد تفعيل مزود الدفع." /><div className="empty-state"><span className="empty-icon" aria-hidden="true">▱</span><h2>الدفع غير مفعّل حاليًا</h2><p>لن تُطلب أو تُحفظ أي بيانات دفع في هذه النسخة.</p></div><PageActions onBack={onBack} onNext={onNext} nextLabel="عرض شاشة التأكيد" /></div>;
}
function ConfirmationScreen({ onHome, onTrack }: { onHome: () => void; onTrack: () => void }) {
  return <div className="centered-screen"><div className="success-mark">✓</div><p className="eyebrow">شاشة التأكيد جاهزة</p><h1>سيظهر تأكيد طلبك هنا</h1><p className="lead">لم يتم إنشاء طلب فعلي أو رقم طلب لأن قاعدة البيانات والدفع غير مربوطين بعد.</p><button className="primary-button" onClick={onTrack}>الانتقال إلى التتبع</button><button className="text-button" onClick={onHome}>العودة للرئيسية</button></div>;
}
function TrackingScreen({ onHome }: { onHome: () => void }) {
  const [trackingNumber, setTrackingNumber] = useState(""); const [message, setMessage] = useState("");
  return <div><ScreenHeading number="" title="تتبع طلبك" subtitle="أدخل رقم الطلب لمعرفة حالته عند تفعيل الربط." /><div className="tracking-card"><label>رقم الطلب<input inputMode="numeric" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="أدخل رقم الطلب" /></label><button className="primary-button" onClick={() => setMessage(trackingNumber.trim() ? "التتبع سيتاح بعد ربط قاعدة البيانات." : "أدخل رقم الطلب أولًا.")}>تتبع الطلب</button><ErrorMessage message={message} neutral /></div><div className="status-preview" aria-label="مراحل حالة الطلب">{["جديد", "بانتظار الاستلام", "تم الاستلام", "تحت المعالجة", "جاهز", "بالتوصيل", "تم التسليم"].map((status) => <span key={status}>{status}</span>)}</div><button className="text-button standalone" onClick={onHome}>العودة للرئيسية</button></div>;
}
function ScreenHeading({ number, title, subtitle }: { number: string; title: string; subtitle: string }) { return <header className="screen-heading">{number && <span>{number}</span>}<h1>{title}</h1><p>{subtitle}</p></header>; }
function PageActions({ onBack, onNext, nextLabel }: { onBack: () => void; onNext: () => void; nextLabel: string }) { return <div className="page-actions"><button className="secondary-button" onClick={onBack}>رجوع</button><button className="primary-button" onClick={onNext}>{nextLabel} <span>←</span></button></div>; }
function ErrorMessage({ message, neutral = false }: { message: string; neutral?: boolean }) { return message ? <p className={neutral ? "message neutral" : "message"} role="status">{message}</p> : null; }
function formatDate(value: string) { return value ? new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "غير محدد"; }
