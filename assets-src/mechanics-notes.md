# הערות מימוש מכניקות ב-Phaser 4

> נבדק מול תיעוד Phaser v4.1.0 ומדריך ההגירה. הבדל קריטי מ-v3: ב-`DynamicTexture`/`RenderTexture` הציור **נכנס לתור (buffer)** ומתבצע רק כשקוראים ל-`render()`. אם לא קוראים לו, הטקסטורה נשארת ריקה.

## (א) מריחת רוטב + אחוז כיסוי
- יוצרים `RenderTexture` בגודל הבצק בלבד (למשל 512×512, לא בגודל כל המסך) ומניחים אותו מעל תמונת הבצק. תמונת שוליים (הקרום) יושבת מעליו ומסתירה חריגות קטנות, כך שבדרך כלל אין צורך במסכה.
- אם בכל זאת צריך מסכה: ב-v4 `BitmapMask` הוחלף ב-filter מסוג `Mask` (`rt.filters.internal.addMask(shape)`). ⚠ לא נמדד ביצועית בנייד, ולכן עדיף לנסות קודם את פתרון הקרום.
- כל מכחול הוא `rt.stamp('brush', null, x, y, {scale, angle})`. בזמן `pointermove` רק צוברים נקודות, וקוראים ל-`rt.render()` **פעם אחת בכל פריים** (ב-`update`).
- **אינטרפולציה:** בין הנקודה הקודמת לנוכחית מוסיפים stamp כל `brushR*0.5` px, כך שהחלקה מהירה לא משאירה חורים. אפשרות נוספת: `pointer.getInterpolatedPosition(steps)` (קיים ב-v4.1).
- **מדידת כיסוי בלי לקרוא פיקסלים מה-GPU:** רשת לוגית של 32×32 (`Uint8Array`). בטעינה מסמנים אילו תאים נמצאים בתוך מעגל הבצק (`N`). כל stamp מסמן את התאים שברדיוס שלו, ו-`coverage = filled / N`.
- סף סיום של כ-75%. אחרי שעוברים אותו, אנימציה "ממלאת" את כל הרוטב ומגיעה חגיגה.

```js
function paint(x, y) {                  // נקרא לכל pointermove
  const d = Phaser.Math.Distance.Between(last.x, last.y, x, y);
  const n = Math.max(1, Math.ceil(d / (R * 0.5)));
  for (let i = 1; i <= n; i++) {
    const px = last.x + (x - last.x) * i / n, py = last.y + (y - last.y) * i / n;
    if (insideDough(px, py)) { rt.stamp('brush', null, px, py); markGrid(px, py, R); }
  }
  last.set(x, y); dirty = true;
}
// update(): if (dirty) { rt.render(); dirty = false; if (filled / N >= 0.75) finish(); }
```

## (ב) רידוד בצק במערוך (שפשוף)
- כל עוד `pointer.isDown` והאצבע נמצאת על הבצק, צוברים את המרחק שעבר מ-`prevPosition` ומוסיפים בונוס קטן על כל שינוי כיוון (dot product שלילי בין שני וקטורי תנועה רצופים).
- `progress = clamp(dist / K, 0, 1)`, כאשר K מכויל כך שבערך 6–8 תנועות הלוך-חזור מספיקות. ההתקדמות לא יורדת אף פעם.
- ממפים את `progress` לתצוגה: הכדור מתכווץ ונעלם (`alpha 1→0`), הבצק השטוח גדל (`scale 0.4→1`) ומופיע (`alpha 0→1`), והמערוך עוקב אחרי האצבע. כל תנועה נחשבת, בלי דרישת כיוון מדויקת.

## (ג) מלכודות ביצועים בנייד
- לא קוראים ל-`snapshot`/`snapshotPixel` בכל פריים (זו קריאה חזרה מה-GPU, readback). לכל היותר פעם אחת בסוף, לצורך דיבאג.
- גודל `RenderTexture` מינימלי (עד 1024 px). הרזולוציה הלוגית קבועה (למשל 720×1280) עם `Scale.FIT`, ולא מרנדרים ב-devicePixelRatio 3 מלא.
- לא יוצרים אובייקטים ב-`pointermove`: משתמשים ב-pool של חלקיקים/וקטורים ובאובייקט `last` אחד שחוזר על עצמו.
- מאחדים (batching) את ה-stamps של כל פריים לקריאת `render()` אחת.
- SVG נטען כ-raster בגודל מפורש: `this.load.svg(key, url, { width, height })`. ⚠ זה API של v3, וצריך לוודא ב-v4. אין לטעון בגודל ברירת המחדל ולהגדיל אחר כך.
- CSS: `touch-action: none` על ה-canvas, `overscroll-behavior: none`, ו-`user-scalable=no` ב-viewport, כדי למנוע גלילה, זום ו-pull-to-refresh.
- Multi-touch: ברירת המחדל היא מצביע מגע אחד. שומרים את `pointer.id` של הנגיעה הראשונה ומתעלמים מהשאר. `input.addPointer()` רק אם באמת צריך.
- אודיו ב-iOS נפתח רק אחרי מחוות משתמש. מתחילים במסך "לחצי להתחיל" ומוודאים ש-`sound.locked` הוא false. ⚠ ה-unlock האוטומטי ידוע מ-v3.
- איבוד הקשר WebGL (context loss) קורה במעבר בין אפליקציות: מאזינים לאירוע, משהים את המשחק ומציירים מחדש את ה-RT מתוך הרשת הלוגית. ⚠ שמות האירועים ב-v4 לא אומתו.
- ב-v4 הטקסטורות בכיוון GL (Y=0 למטה). `stamp` מטפל בזה, אבל חשוב לזכור את זה בקוד shader או pixel ידני.

## מקורות
1. Phaser v3→v4 Migration Guide: https://github.com/phaserjs/phaser/blob/master/changelog/v4/4.0/MIGRATION-GUIDE.md
2. DynamicTexture API (v4.1): https://docs.phaser.io/api-documentation/class/textures-dynamictexture
3. RenderTexture concepts: https://docs.phaser.io/phaser/concepts/gameobjects/render-texture
4. Pointer API (v4.1): https://docs.phaser.io/api-documentation/class/input-pointer
5. Migrating from Phaser 3 to Phaser 4 (phaser.io, 2026): https://phaser.io/news/2026/04/migrating-from-phaser-3-to-phaser-4-what-you-need-to-know
