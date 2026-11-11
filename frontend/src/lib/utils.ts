export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const imgUrl = (u: string) => (u?.startsWith("/uploads") ? API + u : u);
export const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
export const todayIso = () => iso(new Date());
export const fmt = (s: string, o: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) =>
  s ? parse(s).toLocaleDateString("en-US", o) : "";
export const nightsBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 864e5);
export const fallbackImg = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = "data:image/svg+xml;utf8," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%' height='100%' fill='#e5e5e5'/><text x='50%' y='50%' fill='#999' font-family='sans-serif' font-size='22' text-anchor='middle'>Photo unavailable</text></svg>");
};
