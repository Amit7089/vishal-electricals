
import { useEffect, useState } from "react";
import { Star, Send, LoaderCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import api from "../services/api";

function StarRating({ value = 0, onChange, size = 20, interactive = false }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className={interactive ? "cursor-pointer transition hover:scale-110" : "cursor-default"}
        >
          <Star
            size={size}
            className={
              star <= value
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300"
            }
          />
        </button>
      ))}
    </div>
  );
}

function getReviewList(data) {
  const result = data?.data ?? data;
  return Array.isArray(result?.reviews) ? result.reviews : [];
}

export default function ReviewSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadReviews() {
    try {
      const response = await api.get(
        `/reviews/${encodeURIComponent(productId)}`
      );

      const data = response.data?.data ?? response.data;
      const list = getReviewList(response.data);

      setReviews(list);
      setAverageRating(Number(data?.averageRating) || 0);
      setTotalReviews(Number(data?.totalReviews) || list.length);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Reviews load nahi ho paaye."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!productId) return;

    setLoading(true);
    loadReviews();
    // Load reviews whenever the selected product changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanComment = comment.trim();

    if (!rating || rating < 1 || rating > 5) {
      toast.error("1 se 5 stars tak rating select karein.");
      return;
    }

    if (cleanComment.length < 3) {
      toast.error("Review kam se kam 3 characters ka hona chahiye.");
      return;
    }

    if (cleanComment.length > 1000) {
      toast.error("Review 1000 characters se chhota rakhein.");
      return;
    }

    try {
      setSubmitting(true);

      await api.post(`/reviews/${encodeURIComponent(productId)}`, {
        rating,
        comment: cleanComment,
      });

      toast.success("Aapka review submit ho gaya!");
      setComment("");
      setRating(5);

      await loadReviews();
    } catch (error) {
      const status = error.response?.status;

      if (status === 401 || status === 403) {
        toast.error("Review dene ke liye pehle login karein.");
      } else {
        toast.error(
          error.response?.data?.message || "Review submit nahi ho paaya."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-12 border-t border-gray-200 pt-10">
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-orange-600">
          Customer Feedback
        </p>

        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Customer Reviews
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Is product ke baare mein customers ka experience dekhein.
        </p>
      </div>

      <div className="mb-8 grid gap-5 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-[180px_1fr] sm:p-7">
        <div className="flex flex-col justify-center border-b border-gray-100 pb-5 sm:border-b-0 sm:border-r sm:pb-0">
          <p className="text-4xl font-extrabold text-gray-900">
            {averageRating.toFixed(1)}
            <span className="text-xl text-gray-400">/5</span>
          </p>

          <div className="my-2">
            <StarRating value={Math.round(averageRating)} />
          </div>

          <p className="text-sm text-gray-500">
            {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>

        <div className="flex flex-col justify-center">
          <h3 className="mb-2 font-semibold text-gray-900">
            Share your experience
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Your rating
              </label>

              <div className="flex items-center gap-3">
                <StarRating
                  value={rating}
                  onChange={setRating}
                  size={27}
                  interactive
                />
                <span className="text-sm font-medium text-gray-600">
                  {rating}/5
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="review-comment"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Your review
              </label>

              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Product quality, performance aur apna experience batayein..."
                rows={4}
                minLength={3}
                maxLength={1000}
                required
                className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />

              <p className="mt-1 text-right text-xs text-gray-400">
                {comment.length}/1000
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      </div>

      <div>
        <h3 className="mb-5 flex items-center gap-2 text-xl font-bold text-gray-900">
          <MessageSquare size={21} className="text-orange-600" />
          All Reviews ({totalReviews})
        </h3>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
            <LoaderCircle size={22} className="animate-spin" />
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 px-5 py-10 text-center">
            <Star size={34} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-800">
              Abhi koi review nahi hai
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Is product ka pehla review aap de sakte hain.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <article
                key={review._id}
                className="rounded-2xl border border-gray-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {review.user?.fullName ||
                        review.user?.name ||
                        review.userName ||
                        "Customer"}
                    </p>

                    <div className="mt-2">
                      <StarRating value={Number(review.rating) || 0} size={17} />
                    </div>
                  </div>

                  {review.createdAt && (
                    <time className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  )}
                </div>

                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                  {review.comment}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
