export default function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav className="pager" aria-label="Pagination">
      <button disabled={page === 1} onClick={() => onPage(page - 1)}>‹</button>
      {nums.map((n, i) => <span key={n}>{i > 0 && n - nums[i - 1] > 1 && <em>…</em>}<button className={n === page ? "on" : ""} onClick={() => onPage(n)}>{n}</button></span>)}
      <button disabled={page === pages} onClick={() => onPage(page + 1)}>›</button>
    </nav>
  );
}
