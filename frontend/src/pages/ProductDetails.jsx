import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import useFetch from '../hooks/useFetch.js';
import { deleteListing, fetchListing, fetchListingReviews, submitListingReview } from '../services/listingService.js';
import { startConversation, submitListingReport } from '../services/messagingService.js';
import { formatPrice } from '../utils/format.js';
import WishlistButton from '../components/WishlistButton.jsx';

const conditionLabels = {
  LIKE_NEW: 'Like new',
  GOOD: 'Good',
  FAIR: 'Fair',
};

const listingTypeLabels = {
  SALE: 'For sale',
  RENT: 'For rent',
  EXCHANGE: 'Exchange',
  GIVEAWAY: 'Free item',
  SERVICE: 'Student service',
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const loadListing = useCallback(() => fetchListing(id), [id]);
  const listingRequest = useFetch(loadListing);
  const [reviewData, setReviewData] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState('');
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState('');
  const [startingConversation, setStartingConversation] = useState(false);
  const [conversationError, setConversationError] = useState('');
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setReviewLoading(true);
    setReviewError('');
    fetchListingReviews(id)
      .then((data) => {
        if (active) setReviewData(data);
      })
      .catch((error) => {
        if (active) setReviewError(error.userMessage || 'Could not load reviews.');
      })
      .finally(() => {
        if (active) setReviewLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, token]);

  async function submitReview(event) {
    event.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    setReviewSubmitting(true);
    setReviewSubmitError('');
    try {
      const updatedReviews = await submitListingReview(Number(id), {
        rating: Number(reviewRating),
        comment: reviewComment.trim(),
      });
      setReviewData(updatedReviews);
      setReviewComment('');
    } catch (error) {
      setReviewSubmitError(error.userMessage || 'Could not submit your review.');
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function messageSeller() {
    if (!token) {
      navigate('/login');
      return;
    }
    setStartingConversation(true);
    setConversationError('');
    try {
      const conversation = await startConversation(Number(id));
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      setConversationError(error.userMessage || 'Could not start a conversation.');
    } finally {
      setStartingConversation(false);
    }
  }

  async function submitReport(event) {
    event.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    setReportSubmitting(true);
    setReportError('');
    try {
      await submitListingReport(Number(id), reportReason.trim());
      setReportSubmitted(true);
      setReportFormOpen(false);
      setReportReason('');
    } catch (error) {
      setReportError(error.userMessage || 'Could not submit this report.');
    } finally {
      setReportSubmitting(false);
    }
  }

  async function removeListing() {
    if (!window.confirm('Remove this listing from the marketplace?')) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteListing(id);
      navigate('/', { replace: true });
    } catch (error) {
      setDeleteError(error.userMessage || 'Could not remove this listing.');
    } finally {
      setDeleting(false);
    }
  }

  if (listingRequest.loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Loading lines={5} />
      </div>
    );
  }

  if (listingRequest.error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">← Back to marketplace</Link>
        <div className="mt-6"><ErrorState message={listingRequest.error} onRetry={listingRequest.reload} /></div>
      </div>
    );
  }

  const listing = listingRequest.data;
  if (!listing) return null;
  const isOwner = user?.id != null && String(user.id) === String(listing.seller?.id);

  return (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">← Back to marketplace</Link>
        <article className="mt-5 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">
          <div className="relative min-h-72 bg-slate-100 sm:min-h-96">
            {listing.imageUrl ? (
              <img src={listing.imageUrl} alt={listing.title} className="h-full min-h-72 w-full object-cover sm:min-h-96" />
            ) : (
              <div className="flex h-full min-h-72 items-center justify-center text-7xl sm:min-h-96" aria-hidden="true">{listing.category?.icon || '🛍️'}</div>
            )}
            {listing.demo && <span className="absolute left-4 top-4 rounded-full bg-slate-900/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">Demo listing</span>}
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{listing.category?.name || 'Campus find'}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{listingTypeLabels[listing.listingType] || listing.listingType}</span>
            </div>
            <div className="mt-5 flex items-start justify-between gap-3">
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">{listing.title}</h1>
              {listing.hostelClearance && (
                <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-900">
                  Hostel clearance
                </span>
              )}
              <WishlistButton listing={listing} className="shrink-0 border border-slate-200" />
            </div>
            {listing.studentDiscountEligible && listing.studentDiscountedPrice != null ? (
              <div className="mt-4">
                <span className="block text-sm text-slate-500 line-through">Original price: {formatPrice(Number(listing.price))}</span>
                <p className="mt-1 text-3xl font-bold text-emerald-800">
                  Student price: {formatPrice(Number(listing.studentDiscountedPrice))}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  {listing.discountPercentage != null && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900">
                      {Number(listing.discountPercentage)}% student discount
                    </span>
                  )}
                  {listing.amountSaved != null && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-800">
                      You save {formatPrice(Number(listing.amountSaved))}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <>
                <p className="mt-4 text-3xl font-bold text-slate-900">{formatPrice(Number(listing.price))}</p>
                {listing.studentDiscountAvailable && (
                  <p className="mt-2 text-sm font-medium text-indigo-700">
                    Verify your student account to unlock student pricing.
                  </p>
                )}
              </>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {listing.listingType !== 'SERVICE' && (
                <span className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
                  Condition: <strong className="font-semibold text-slate-800">{conditionLabels[listing.condition] || listing.condition}</strong>
                </span>
              )}
              {listing.listingType === 'SERVICE' && (
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-800">
                  Offered by a student
                </span>
              )}
              {listing.seller?.verified && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                  ✓ Verified student
                </span>
              )}
            </div>

            <section className="mt-8 border-t border-slate-100 pt-6" aria-labelledby="description-heading">
              <h2 id="description-heading" className="text-lg font-semibold text-slate-900">{listing.listingType === 'SERVICE' ? 'About this service' : 'About this item'}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{listing.description}</p>
            </section>

            <section className="mt-8 border-t border-slate-100 pt-6" aria-labelledby="seller-heading">
              <h2 id="seller-heading" className="text-lg font-semibold text-slate-900">Seller</h2>
              <p className="mt-2 text-sm text-slate-700">{listing.seller?.name || 'Campus seller'}</p>
              {reviewData?.sellerReviewCount > 0 && (
                <p className="mt-1 text-sm text-slate-600">
                  ★ {reviewData.sellerAverageRating.toFixed(1)} seller rating
                  <span className="text-slate-500"> ({reviewData.sellerReviewCount} {reviewData.sellerReviewCount === 1 ? 'review' : 'reviews'})</span>
                </p>
              )}
              {listing.createdAt && (
                <p className="mt-1 text-xs text-slate-500">
                  Listed {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(listing.createdAt))}
                </p>
              )}
            </section>

            <section className="mt-8 border-t border-slate-100 pt-6" aria-labelledby="reviews-heading">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="reviews-heading" className="text-lg font-semibold text-slate-900">Ratings &amp; reviews</h2>
                {reviewData?.listingReviewCount > 0 && (
                  <p className="text-sm font-medium text-slate-600">
                    ★ {reviewData.listingAverageRating.toFixed(1)} / 5
                    <span className="ml-1 font-normal">({reviewData.listingReviewCount} {reviewData.listingReviewCount === 1 ? 'review' : 'reviews'})</span>
                  </p>
                )}
              </div>
              {reviewLoading ? (
                <p className="mt-3 text-sm text-slate-500">Loading reviews…</p>
              ) : reviewError ? (
                <p role="alert" className="mt-3 text-sm text-red-700">{reviewError}</p>
              ) : reviewData?.reviews?.length ? (
                <ul className="mt-4 divide-y divide-slate-100">
                  {reviewData.reviews.map((review) => (
                    <li key={review.id} className="py-4 first:pt-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">{review.reviewerName}</p>
                        <p className="text-sm text-amber-600" aria-label={`${review.rating} out of 5 stars`}>
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </p>
                      </div>
                      {review.comment && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{review.comment}</p>}
                      {review.createdAt && (
                        <p className="mt-1 text-xs text-slate-500">
                          {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(review.createdAt))}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No reviews yet. Be the first to share your experience.</p>
              )}

              {token && !isOwner && !reviewData?.hasReviewed && !reviewLoading && !reviewError && (
                <form onSubmit={submitReview} className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Leave a review</h3>
                  <label htmlFor="listing-review-rating" className="mt-3 block text-sm font-medium text-slate-700">Your rating</label>
                  <select id="listing-review-rating" required value={reviewRating}
                    onChange={(event) => setReviewRating(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
                    <option value="5">5 stars — Excellent</option>
                    <option value="4">4 stars — Good</option>
                    <option value="3">3 stars — Average</option>
                    <option value="2">2 stars — Poor</option>
                    <option value="1">1 star — Very poor</option>
                  </select>
                  <label htmlFor="listing-review-comment" className="mt-3 block text-sm font-medium text-slate-700">Comment (optional)</label>
                  <textarea id="listing-review-comment" maxLength={1000} rows="3" value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                  {reviewSubmitError && <p role="alert" className="mt-2 text-sm text-red-700">{reviewSubmitError}</p>}
                  <button type="submit" disabled={reviewSubmitting} className="btn-primary mt-3 rounded-lg px-4 py-2 disabled:opacity-60">
                    {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                  </button>
                </form>
              )}
              {!token && !reviewLoading && !reviewError && (
                <button type="button" onClick={() => navigate('/login')} className="mt-4 text-sm font-semibold text-indigo-700 hover:text-indigo-900">
                  Sign in to leave a review
                </button>
              )}
              {reviewData?.hasReviewed && <p role="status" className="mt-4 text-sm text-emerald-800">You have already reviewed this listing.</p>}
            </section>

            <div className="mt-6">
              <button type="button" onClick={messageSeller} disabled={startingConversation}
                className="btn-primary w-full rounded-xl px-5 py-3 disabled:opacity-60">
                {startingConversation ? 'Opening chat…' : 'Message seller'}
              </button>
              {conversationError && <p role="alert" className="mt-2 text-sm text-red-700">{conversationError}</p>}
            </div>
            {isOwner && (
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to={`${listing.listingType === 'SERVICE' ? '/services' : '/listings'}/${listing.id}/edit`} className="btn-secondary flex-1 justify-center">
                  {listing.listingType === 'SERVICE' ? 'Edit service' : 'Edit listing'}
                </Link>
                <button type="button" onClick={removeListing} disabled={deleting}
                  className="btn-secondary flex-1 justify-center border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60">
                  {deleting ? 'Removing…' : 'Delete listing'}
                </button>
              </div>
            )}
            {deleteError && <p role="alert" className="mt-2 text-sm text-red-700">{deleteError}</p>}

            <div className="mt-4">
              {reportSubmitted ? (
                <p role="status" className="text-sm font-medium text-emerald-800">Thanks. Your report has been sent to the moderation team.</p>
              ) : (
                <button type="button" onClick={() => token ? setReportFormOpen((open) => !open) : navigate('/login')}
                  className="text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-900">
                  Report this listing
                </button>
              )}
              {reportFormOpen && (
                <form onSubmit={submitReport} className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label htmlFor="listing-report-reason" className="block text-sm font-semibold text-slate-800">Why are you reporting this listing?</label>
                  <textarea id="listing-report-reason" required minLength={5} maxLength={1000} rows="3" value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                  {reportError && <p role="alert" className="mt-2 text-sm text-red-700">{reportError}</p>}
                  <button type="submit" disabled={reportSubmitting} className="btn-secondary mt-3 rounded-lg px-4 py-2 disabled:opacity-60">
                    {reportSubmitting ? 'Sending…' : 'Submit report'}
                  </button>
                </form>
              )}
            </div>

            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Arrange a safe on-campus handover and inspect the item before making payment.
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
