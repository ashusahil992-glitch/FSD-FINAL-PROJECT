import { useState } from 'react';
import { Link } from 'react-router-dom';
import WishlistButton from './WishlistButton.jsx';
import { formatPrice } from '../utils/format.js';

const conditionLabels = {
  LIKE_NEW: 'Like new',
  GOOD: 'Good',
  FAIR: 'Fair',
};

const listingTypeLabels = {
  SALE: null,
  RENT: 'For rent',
  EXCHANGE: 'Exchange',
  GIVEAWAY: 'Free',
  SERVICE: 'Student service',
};

export default function ProductCard({ listing }) {
  const [imageFailed, setImageFailed] = useState(false);
  const listingTypeLabel = listingTypeLabels[listing.listingType];
  const detailsUrl = `/listings/${listing.id}`;

  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Link to={detailsUrl} aria-label={`View ${listing.title}`} className="block h-full w-full">
        {listing.imageUrl && !imageFailed ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl" aria-hidden="true">{listing.category?.icon || '🛍️'}</div>
        )}
        </Link>
        <WishlistButton listing={listing} className="absolute right-2.5 top-2.5 h-9 w-9 text-lg" />
        {listing.demo && <span className="absolute left-2.5 top-2.5 rounded-full bg-slate-900/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">Demo listing</span>}
        {listing.hostelClearance && <span className={`absolute ${listing.demo ? 'left-2.5 top-10' : 'left-2.5 top-2.5'} rounded-full bg-emerald-700/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white`}>Hostel clearance</span>}
      </div>
      <div className="p-3 sm:p-4">
        <div className="flex min-h-5 items-center justify-between gap-2">
          <span className="truncate text-xs font-medium text-slate-500">{listing.category?.name || 'Campus find'}</span>
          {listing.seller?.verified && <span className="shrink-0 text-[10px] font-semibold text-emerald-700 sm:text-xs"><span aria-hidden="true">✓ </span>Verified student</span>}
        </div>
        {listing.studentDiscountAvailable && (
          <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900">
            {listing.studentDiscountEligible && listing.discountPercentage != null
              ? `${Number(listing.discountPercentage)}% student discount` : 'Student discount'}
          </span>
        )}
        <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900 sm:text-base">
          <Link to={detailsUrl} className="hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-brand-500">{listing.title}</Link>
        </h3>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {listing.studentDiscountEligible && listing.studentDiscountedPrice != null ? (
            <>
              <span className="text-xs text-slate-500 line-through">{formatPrice(Number(listing.price))}</span>
              <span className="text-base font-bold text-emerald-800 sm:text-lg">{formatPrice(Number(listing.studentDiscountedPrice))}</span>
            </>
          ) : (
            <span className="text-base font-bold text-slate-900 sm:text-lg">{formatPrice(Number(listing.price))}</span>
          )}
          {listingTypeLabel && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">{listingTypeLabel}</span>}
        </p>
        {listing.studentDiscountAvailable && !listing.studentDiscountEligible && (
          <p className="mt-1 text-[11px] leading-4 text-indigo-700">Verify your student account to unlock student pricing.</p>
        )}
        {listing.studentDiscountEligible && listing.amountSaved != null && (
          <p className="mt-1 text-xs font-medium text-emerald-800">You save {formatPrice(Number(listing.amountSaved))}</p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className="truncate text-xs text-slate-500">
            {listing.listingType === 'SERVICE' ? 'Offered by' : conditionLabels[listing.condition] || listing.condition}
          </span>
          <span className="max-w-[55%] truncate text-right text-xs text-slate-500">{listing.seller?.name || 'Campus seller'}</span>
        </div>
      </div>
    </article>
  );
}
