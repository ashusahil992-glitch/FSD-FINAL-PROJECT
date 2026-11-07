import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import useFetch from '../hooks/useFetch.js';
import { createListing, fetchListing, updateListing } from '../services/listingService.js';
import { fetchCategories } from '../services/categoryService.js';

const transactionTypes = [
  { value: 'SALE', label: 'Sell' },
  { value: 'RENT', label: 'Rent out' },
  { value: 'EXCHANGE', label: 'Exchange' },
  { value: 'GIVEAWAY', label: 'Give away' },
  { value: 'SERVICE', label: 'Offer a service' },
];

const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

export default function SellItem({ serviceOnly = false, hostelClearanceOnly = false }) {
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const { id: listingId } = useParams();
  if (!token) {
    return (
      <div className="min-h-[70vh] bg-slate-50 px-4 py-14">
        <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{serviceOnly ? 'Sign in to offer a service' : 'Sign in to sell on campus'}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Your account is used to save the listing and associate it with you as the provider.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/login" className="btn-primary rounded-xl px-5 py-3">Sign in</Link>
            <Link to="/register" className="btn-secondary rounded-xl px-5 py-3">Create account</Link>
          </div>
        </section>
      </div>
    );
  }
  return <SellItemForm listingId={listingId} user={user} serviceOnly={serviceOnly} hostelClearanceOnly={hostelClearanceOnly} />;
}

function SellItemForm({ listingId, user, serviceOnly, hostelClearanceOnly }) {
  const navigate = useNavigate();
  const categoriesRequest = useFetch(fetchCategories);
  const listingFetcher = useCallback(() => (listingId ? fetchListing(listingId) : Promise.resolve(null)), [listingId]);
  const listingRequest = useFetch(listingFetcher);
  const [form, setForm] = useState({
    title: '',
    categorySlug: '',
    listingType: serviceOnly ? 'SERVICE' : 'SALE',
    price: '',
    studentDiscountEnabled: false,
    studentDiscountedPrice: '',
    hostelClearance: hostelClearanceOnly,
    condition: '',
    description: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const listing = listingRequest.data;
    if (!listing) return;
    const owner = String(listing.seller?.id) === String(user?.id);
    if (owner) {
      setForm({
        title: listing.title,
        categorySlug: listing.category?.slug || '',
        listingType: listing.listingType,
        price: Number(listing.price) > 0 ? String(listing.price) : '',
        studentDiscountEnabled: Boolean(listing.studentDiscountAvailable),
        studentDiscountedPrice: listing.studentDiscountedPrice == null
          ? '' : String(listing.studentDiscountedPrice),
        hostelClearance: Boolean(listing.hostelClearance),
        condition: listing.condition,
        description: listing.description,
      });
    }
  }, [listingRequest.data, user?.id]);

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'listingType' && ['GIVEAWAY', 'EXCHANGE'].includes(value)
        ? { studentDiscountEnabled: false, studentDiscountedPrice: '' } : {}),
    }));
    setRequestError('');
  }

  function handleImageChange(event) {
    const selectedImage = event.target.files?.[0] || null;
    setImagePreview(null);
    setImageError('');
    if (!selectedImage) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedImage.type)) {
      setImageError('Choose a JPG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }
    if (selectedImage.size > 5 * 1024 * 1024) {
      setImageError('Choose an image smaller than 5 MB.');
      event.target.value = '';
      return;
    }
    setImagePreview(URL.createObjectURL(selectedImage));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setRequestError('');
    if (imageError) return;
    if (form.studentDiscountEnabled) {
      const originalPrice = Number(form.price);
      const discountedPrice = Number(form.studentDiscountedPrice);
      if (!Number.isFinite(originalPrice) || originalPrice <= 0
          || !Number.isFinite(discountedPrice) || discountedPrice <= 0
          || discountedPrice >= originalPrice) {
        setRequestError('Student discounted price must be greater than zero and lower than the original price.');
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        categorySlug: form.categorySlug,
        listingType: form.listingType,
        condition: serviceOnly ? 'GOOD' : form.condition,
        price: form.listingType === 'GIVEAWAY' || form.listingType === 'EXCHANGE'
          ? 0
          : Number(form.price || 0),
        studentDiscountEnabled: form.studentDiscountEnabled,
        studentDiscountedPrice: form.studentDiscountEnabled ? Number(form.studentDiscountedPrice) : null,
        hostelClearance: form.hostelClearance,
      };
      const listing = listingId
        ? await updateListing(listingId, payload)
        : await createListing(payload);
      toast.success(listingId ? 'Your listing has been updated.' : 'Your listing has been saved.');
      navigate(`/listings/${listing.id}`, { replace: true });
    } catch (error) {
      setRequestError(error.userMessage || 'Could not save your listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const priceRequired = form.listingType === 'SALE' || form.listingType === 'RENT';
  const discountEligibleListing = Number(form.price) > 0
    && !['GIVEAWAY', 'EXCHANGE'].includes(form.listingType);
  const discountPercentage = discountEligibleListing && form.studentDiscountedPrice
    ? (((Number(form.price) - Number(form.studentDiscountedPrice)) / Number(form.price)) * 100)
    : null;

  if (listingId && listingRequest.loading) {
    return <div className="mx-auto max-w-3xl px-4 py-10"><Loading lines={5} /></div>;
  }
  if (listingId && listingRequest.error) {
    return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorState message={listingRequest.error} onRetry={listingRequest.reload} /></div>;
  }
  if (listingId && listingRequest.data && String(listingRequest.data.seller?.id) !== String(user?.id)) {
    return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorState message="You can only edit your own listings." /></div>;
  }

  return (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">← Back to marketplace</Link>
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">
            {serviceOnly ? 'Share your skills' : hostelClearanceOnly ? 'Hostel clearance' : 'Pass it on'}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {serviceOnly ? listingId ? 'Edit your service' : 'Offer a student service'
              : hostelClearanceOnly && !listingId ? 'List a hostel item'
                : listingId ? 'Edit your listing' : 'List an item'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {serviceOnly
              ? 'Help students find your skills, from tutoring and design to repairs. They can contact you through campus messages.'
              : 'Your listing is saved to the marketplace database and associated with your signed-in account.'}
          </p>

          {requestError && <div className="mt-5"><ErrorState message={requestError} /></div>}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="listing-title" className="mb-2 block text-sm font-semibold text-slate-800">{serviceOnly ? 'Service title' : 'Item title'} <span aria-hidden="true">*</span></label>
                <input id="listing-title" name="title" type="text" maxLength={140} required value={form.title} onChange={updateField}
                  placeholder={serviceOnly ? 'e.g. First-year calculus tutoring' : 'e.g. Engineering Mathematics textbook'} className={inputClass} />
              </div>

              <div>
                <label htmlFor="listing-category" className="mb-2 block text-sm font-semibold text-slate-800">Category <span aria-hidden="true">*</span></label>
                {categoriesRequest.loading && <Loading lines={1} />}
                {categoriesRequest.error && <ErrorState message={categoriesRequest.error} onRetry={categoriesRequest.reload} />}
                {categoriesRequest.data && (
                  <select id="listing-category" name="categorySlug" required value={form.categorySlug} onChange={updateField} className={inputClass}>
                    <option value="" disabled>Select a category</option>
                    {categoriesRequest.data
                      .filter((category) => !serviceOnly || category.parentName === 'Services')
                      .map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.parentName ? `${category.parentName} / ${category.name}` : category.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {!serviceOnly && <div>
                <label htmlFor="listing-type" className="mb-2 block text-sm font-semibold text-slate-800">What would you like to do? <span aria-hidden="true">*</span></label>
                <select id="listing-type" name="listingType" value={form.listingType} onChange={updateField} className={inputClass}>
                  {transactionTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>}

              {!serviceOnly && <fieldset className="sm:col-span-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <legend className="px-1 text-sm font-semibold text-slate-800">Hostel clearance</legend>
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    id="hostel-clearance"
                    type="checkbox"
                    checked={form.hostelClearance}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, hostelClearance: event.target.checked }));
                      setRequestError('');
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>
                    Include this item in Hostel Clearance
                    <span className="mt-1 block text-xs text-slate-500">
                      Use for items you are passing on while moving out of campus accommodation.
                    </span>
                  </span>
                </label>
              </fieldset>}

              {(priceRequired || serviceOnly) && (
                <div>
                  <label htmlFor="listing-price" className="mb-2 block text-sm font-semibold text-slate-800">
                    {serviceOnly ? 'Price per service (₹)'
                      : form.listingType === 'RENT'
                        ? form.studentDiscountEnabled ? 'Original rent (₹)' : 'Rent (₹)'
                        : form.studentDiscountEnabled ? 'Original price (₹)' : 'Price (₹)'}
                    {!serviceOnly && <span aria-hidden="true"> *</span>}
                  </label>
                  <input id="listing-price" name="price" type="number" min={serviceOnly ? '0' : '0.01'} max="10000000" step="0.01" required={!serviceOnly}
                    value={form.price} onChange={updateField} placeholder={serviceOnly ? 'Leave blank to offer for free' : 'e.g. 500'} className={inputClass} />
                </div>
              )}

              {!serviceOnly && discountEligibleListing && (
                <fieldset className="sm:col-span-2 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <legend className="px-1 text-sm font-semibold text-slate-800">Student discount</legend>
                  <label className="flex items-start gap-3 text-sm text-slate-700">
                    <input
                      id="student-discount-enabled"
                      type="checkbox"
                      checked={form.studentDiscountEnabled}
                      onChange={(event) => {
                        setForm((current) => ({ ...current, studentDiscountEnabled: event.target.checked }));
                        setRequestError('');
                      }}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      Enable student-only pricing
                      <span className="mt-1 block text-xs text-slate-500">Only verified students can see the discounted price.</span>
                    </span>
                  </label>
                  {form.studentDiscountEnabled && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="student-discount-price" className="mb-2 block text-sm font-semibold text-slate-800">
                          Student discounted price (₹)
                        </label>
                        <input
                          id="student-discount-price"
                          name="studentDiscountedPrice"
                          type="number"
                          min="0.01"
                          max={form.price || undefined}
                          step="0.01"
                          required
                          value={form.studentDiscountedPrice}
                          onChange={updateField}
                          placeholder="e.g. 400"
                          className={inputClass}
                        />
                      </div>
                      <div className="self-end rounded-xl bg-white p-3 text-sm text-slate-700">
                        Discount: <strong>{discountPercentage != null && Number.isFinite(discountPercentage)
                          ? `${discountPercentage.toFixed(2)}%` : '—'}</strong>
                      </div>
                    </div>
                  )}
                </fieldset>
              )}

              {!serviceOnly && <div>
                  <label htmlFor="listing-condition" className="mb-2 block text-sm font-semibold text-slate-800">Condition <span aria-hidden="true">*</span></label>
                  <select id="listing-condition" name="condition" required value={form.condition} onChange={updateField} className={inputClass}>
                    <option value="" disabled>Select condition</option>
                    <option value="LIKE_NEW">Like new</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                  </select>
                </div>}

              <div className="sm:col-span-2">
                <label htmlFor="listing-description" className="mb-2 block text-sm font-semibold text-slate-800">{serviceOnly ? 'Service details' : 'Description'} <span aria-hidden="true">*</span></label>
                <textarea id="listing-description" name="description" rows="5" maxLength={2000} required
                  value={form.description} onChange={updateField}
                  placeholder={serviceOnly ? 'Describe your experience, what is included, availability, and how students can reach you through campus messages.' : 'Share the item’s condition, useful details, and where on campus to meet.'}
                  className={`${inputClass} resize-y`} />
                <p className="mt-1 text-xs text-slate-500">Avoid including private contact details in your description.</p>
              </div>

              {!serviceOnly && <div className="sm:col-span-2">
                <label htmlFor="listing-image" className="mb-2 block text-sm font-semibold text-slate-800">
                  {serviceOnly ? 'Service image' : 'Item photo'} <span className="font-normal text-slate-500">(optional preview only)</span>
                </label>
                <input id="listing-image" name="image" type="file" accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange} aria-describedby="image-help image-error"
                  className="block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100" />
                <p id="image-help" className="mt-1 text-xs text-slate-500">JPG, PNG, or WebP, up to 5 MB. The listing record is saved, but photo upload is not enabled yet.</p>
                {imageError && <p id="image-error" role="alert" className="mt-2 text-sm font-medium text-red-700">{imageError}</p>}
                {imagePreview && <img src={imagePreview} alt="Selected item preview" className="mt-4 max-h-64 rounded-xl border border-slate-200 object-contain" />}
              </div>}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Link to={serviceOnly ? '/services' : hostelClearanceOnly ? '/hostel-clearance' : '/'} className="btn-secondary">Cancel</Link>
              <button type="submit" disabled={submitting || categoriesRequest.loading || !categoriesRequest.data}
                className="btn-primary rounded-xl px-6 py-3 disabled:opacity-60">
                {submitting ? (listingId ? 'Updating listing…' : serviceOnly ? 'Publishing service…' : 'Saving listing…')
                  : serviceOnly ? listingId ? 'Save service' : 'Publish service'
                    : listingId ? 'Save changes' : 'Publish listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
