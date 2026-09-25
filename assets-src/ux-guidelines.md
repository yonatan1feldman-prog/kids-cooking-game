# הנחיות UX למשחק פיצה בנגיעה — גילאי 3–6

רשימת בדיקה קונקרטית למשחק (Phaser 4, portrait 9:16, טלפון) עבור ילדה בת 5. כל שורה ניתנת לבדיקה על מכשיר אמיתי; התגיות [n] מפנות למקורות בסוף.

- [ ] כל אובייקט שנוגעים בו בגודל פיזי של **2×2 cm לפחות** על המסך. בטלפון זה בערך 30% מרוחב המסך, כלומר ≥ ~300px ב-canvas לוגי ברוחב 1080 (לבדוק עם סרגל על מכשיר אמיתי) [2]
- [ ] אזור הפגיעה (hit area) גדול מהציור בכ-1 cm לכל כיוון, כך שנגיעה שפספסה קצת עדיין נקלטת [3][7]
- [ ] בין שני אזורי נגיעה שכנים יש לפחות ~1 cm של רווח "מת", כדי שנגיעה לא מדויקת לא תפעיל את האובייקט הלא נכון [1][3]
- [ ] רק tap ו-drag (ומריחה/שפשוף חופשיים באצבע) הם מחוות חובה. בלי pinch, rotate, double-tap, long-press, flick או tilt לשום פעולה הכרחית [1][2][3]
- [ ] Drag סלחני: שחרור בטווח snap נדיב (≥ 1.5 cm) ליד היעד נחשב הצלחה. הרמת אצבע באמצע לא מאפסת, והפריט נשאר במקום שבו שוחרר [1][3]
- [ ] משימות מריחה/שפשוף מסתיימות בהשלמה חלקית (כ-70–80% כיסוי), ואז המשחק "משלים" את השאר באנימציה [1][3]
- [ ] Multi-touch מטופל: רק האצבע הראשונה שולטת. אצבע נוספת או כף יד (palm) לא שוברות את הפעולה ולא מפעילות כפתורים. גרירה בשתי אצבעות מתנהגת כמו גרירה באחת [1][3]
- [ ] הקלט נרשם ב-pointerdown ולא ב-pointerup. משוב (צליל + שינוי ויזואלי) מופיע תוך ≤ 100ms מכל נגיעה [1][3]
- [ ] נגיעה ארוכה (עד ~5 שניות) עדיין נחשבת tap. אין סף זמן שמבטל נגיעה [3]
- [ ] אין צורך לקרוא: כל הוראה נמסרת בקול (קריינות בעברית) ובתמונה/אנימציה. טקסט הוא רק קישוט [1][3]
- [ ] הוראות קוליות קצרות, והפעולה נאמרת בסוף המשפט ("כדי לשים עגבנייה — גררי אותה לפיצה"). בחזרות אפשר לקטוע אותן [1][3]
- [ ] כל הוראה קולית מלווה בהדגמה ויזואלית (יד מונפשת שמבצעת את המחווה, או הדגשה של המסלול). אסור להסתמך רק על שינוי מצב ויזואלי (הבהוב) [1][4]
- [ ] אחרי 6–8 שניות בלי פעולה מופיע רמז אוטומטי (glow על האובייקט הבא + היד המדגימה + משפט קצר) [1][3]
- [ ] אין מצב כישלון, אין "Game Over", אין טיימר שמעניש ואין ניקוד שיורד. טעות מקבלת תגובה מעודדת, ואחרי 3 ניסיונות המשחק מסמן את הפתרון [1][3]
- [ ] כל הצלחה מקבלת "payoff" של צליל חגיגי + אנימציה, וכל שלב שמסתיים מקבל חגיגה גדולה יותר [1][3]
- [ ] אובייקטים לחיצים נראים שונים מהרקע (קו מתאר עבה, צבע רווי, תנועה עדינה), ואובייקט שאינו לחיץ לא נראה לחיץ. הרקע פשוט ולא עמוס [1][3]
- [ ] שום אלמנט אינטראקטיבי לא נמצא במרחק של פחות מ-~1 cm משולי המסך, ובמיוחד לא בתחתית (אזור שורש כף היד ו-home indicator) [1][3]
- [ ] כל מה שצריך לשלב נמצא על המסך מההתחלה. בלי גלילה ובלי תפריטים נסתרים. אם יש עוד פריטים, רואים אותם חלקית או עם חץ [1][3]
- [ ] ניווט שטוח (רמה אחת לכל היותר) ואפשר לבטל פעולות (למשל להוריד תוספת מהפיצה בגרירה החוצה) [3]
- [ ] מחוות עקביות לאורך כל המשחק ודומות לעולם האמיתי: מערוך הלוך-חזור, מריחת רוטב באצבע, גרירת תוספות [3]
- [ ] יציאה מהמשחק, הגדרות וכל אזור להורים נמצאים מאחורי parental gate (למשל לחיצה ארוכה של 3 שניות + שאלה למבוגר). הסמל של האזור הזה לא מושך ילדים [1][5]
- [ ] אין פרסומות, אין רכישות בתוך האפליקציה, אין קישורים החוצה, אין analytics של צד שלישי ולא נאסף שום מידע אישי [3][5][6]
- [ ] לכל צליל יש משמעות (משוב, הוראה, חגיגה). מוזיקת רקע שקטה שלא מסתירה קריינות, והורה יכול להשתיק מוזיקה/קול בנפרד [1][3]
- [ ] טעינה ראשונית קצרה (יעד: פחות מ-3 שניות ב-4G), ובזמן המתנה מוצגת אנימציה חיה כדי שהילדה תבין שצריך לחכות [1][3]
- [ ] אין progress bar מופשט ואין נקודות. ההתקדמות נראית באובייקט עצמו (הבצק מתרדד, הרוטב מתפשט, הפיצה מתמלאת) [3]

## מקורות

1. Sesame Workshop (2012), *Best Practices: Designing Touch Tablet Experiences for Preschoolers*. ה-PDF המלא נגיש ונקרא: https://joanganzcooneycenter.org/wp-content/uploads/2020/02/SesameWorkshop-2012.pdf (עמוד פרסום: https://joanganzcooneycenter.org/publication/best-practices-designing-touch-tablet-experiences-for-preschoolers/)
2. Nielsen Norman Group, *Design for Kids Based on Their Stage of Physical Development*: https://www.nngroup.com/articles/children-ux-physical-development/
3. Soni, Aloba, Morga, Wisniewski, Anthony (IDC 2019), *A Framework of Touchscreen Interaction Design Recommendations for Children (TIDRC)*: https://init.cise.ufl.edu/wp-content/uploads/sites/378/2019/04/TIDRC-Framework-soni-et-al-IDC19-final.pdf (ACM: https://dl.acm.org/doi/10.1145/3311927.3323149)
4. Hiniker, Sobel, Hong, Suh, Kim, Kientz (IDC 2015), *Touchscreen Prompts for Preschoolers*: https://dl.acm.org/doi/10.1145/2771839.2771851 (PDF: http://faculty.washington.edu/alexisr/TouchscreenPrompts.pdf)
5. Apple, *App Review Guidelines* (סעיף 1.3 Kids Category, parental gate): https://developer.apple.com/app-store/review/guidelines/
6. Google Play, *Families Policies*: https://support.google.com/googleplay/android-developer/answer/9893335?hl=en
7. Anthony et al., *Physical dimensions of children's touchscreen interactions: Lessons from five years of study on the MTAGIC project* (IJHCS 2019): https://www.sciencedirect.com/science/article/abs/pii/S1071581918302441
