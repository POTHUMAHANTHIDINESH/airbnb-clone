import type { Review } from "@/lib/types";
import { fmt } from "@/lib/utils";

export default function ReviewsSection({ reviews, rating }: { reviews: Review[]; rating: number }) {
  if (!reviews.length) return <section className="section"><h2>No reviews (yet)</h2><p className="muted">Be the first to stay and share your experience.</p></section>;
  return (
    <section className="section" id="reviews">
      <h2>★ {rating.toFixed(2)} · {reviews.length} review{reviews.length > 1 ? "s" : ""}</h2>
      <div className="reviews">
        {reviews.slice(0, 8).map((r) => (
          <div key={r.id} className="review">
            <div className="row gap"><img className="avatar" src={r.author.avatar} alt="" /><div><b>{r.author.name}</b><div className="muted small">{fmt(r.created_at.slice(0, 10), { month: "long", year: "numeric" })}</div></div></div>
            <div className="stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div><p>{r.comment}</p>
          </div>))}
      </div>
    </section>
  );
}
