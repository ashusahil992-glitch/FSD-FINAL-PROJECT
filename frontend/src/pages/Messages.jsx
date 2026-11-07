import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import { fetchConversations, fetchMessages, sendMessage } from '../services/messagingService.js';

export default function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const [messageError, setMessageError] = useState('');
  const [sending, setSending] = useState(false);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => String(conversation.id) === String(conversationId)),
    [conversations, conversationId],
  );

  const loadConversations = useCallback(async () => {
    try {
      const items = await fetchConversations();
      setConversations(items);
      setError('');
      return items;
    } catch (requestError) {
      setError(requestError.userMessage || 'Could not load your conversations.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (id, showLoading = false) => {
    if (!id) {
      setMessages([]);
      return;
    }
    if (showLoading) setMessagesLoading(true);
    try {
      setMessages(await fetchMessages(id));
      setMessageError('');
    } catch (requestError) {
      setMessageError(requestError.userMessage || 'Could not load this conversation.');
    } finally {
      if (showLoading) setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const timer = window.setInterval(loadConversations, 15000);
    return () => window.clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    loadMessages(conversationId, true);
    if (!conversationId) return undefined;
    const timer = window.setInterval(() => loadMessages(conversationId), 4000);
    return () => window.clearInterval(timer);
  }, [conversationId, loadMessages]);

  useEffect(() => {
    const container = document.getElementById('conversation-messages');
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  async function handleSend(event) {
    event.preventDefault();
    if (!conversationId || !draft.trim()) return;
    setSending(true);
    setMessageError('');
    try {
      await sendMessage(conversationId, draft.trim());
      setDraft('');
      await Promise.all([loadMessages(conversationId), loadConversations()]);
    } catch (requestError) {
      setMessageError(requestError.userMessage || 'Could not send your message.');
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Sign in to view messages</h1>
        <Link className="btn-primary mt-5 inline-flex rounded-xl px-5 py-3" to="/login">Sign in</Link>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Messages</h1>
        <p className="mt-1 text-sm text-slate-600">Talk with students about listings. New messages refresh automatically.</p>
      </div>
      <div className="grid min-h-[65vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[19rem_1fr]">
        <aside className="border-b border-slate-200 md:border-b-0 md:border-r" aria-label="Conversations">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">Your conversations</h2>
          {loading && <div className="p-4"><Loading lines={3} /></div>}
          {error && <div className="p-4"><ErrorState message={error} onRetry={loadConversations} /></div>}
          {!loading && !error && conversations.length === 0 && (
            <p className="p-4 text-sm leading-6 text-slate-500">No conversations yet. Open a listing and choose “Message seller” to start one.</p>
          )}
          <ul className="max-h-64 overflow-y-auto md:max-h-[calc(65vh-3rem)]">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/messages/${conversation.id}`)}
                  aria-current={String(conversation.id) === String(conversationId) ? 'page' : undefined}
                  className={`w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${String(conversation.id) === String(conversationId) ? 'bg-indigo-50' : ''}`}
                >
                  <span className="block truncate text-sm font-semibold text-slate-900">{conversation.otherParticipantName}</span>
                  <span className="mt-0.5 block truncate text-xs font-medium text-indigo-700">{conversation.listingTitle}</span>
                  <span className="mt-1 block truncate text-xs text-slate-500">{conversation.lastMessage || 'Conversation started'}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex min-h-[25rem] flex-col" aria-label="Chat">
          {!conversationId && (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500">
              Select a conversation to view messages.
            </div>
          )}
          {conversationId && !loading && !selectedConversation && !error && (
            <div className="p-6"><ErrorState message="Conversation not found or you do not have access to it." /></div>
          )}
          {selectedConversation && (
            <>
              <header className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-semibold text-slate-900">{selectedConversation.otherParticipantName}</h2>
                <Link to={`/listings/${selectedConversation.listingId}`} className="mt-1 block text-sm text-indigo-700 hover:text-indigo-900">
                  {selectedConversation.listingTitle}
                </Link>
              </header>
              <div id="conversation-messages" className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4 sm:p-6" aria-live="polite">
                {messagesLoading && <Loading lines={3} />}
                {messageError && <ErrorState message={messageError} onRetry={() => loadMessages(conversationId, true)} />}
                {!messagesLoading && !messageError && messages.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">Say hello about this listing.</p>
                )}
                {messages.map((message) => {
                  const ownMessage = String(message.senderId) === String(user.id);
                  return (
                    <div key={message.id} className={`flex ${ownMessage ? 'justify-end' : 'justify-start'}`}>
                      <article className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${ownMessage ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
                        {!ownMessage && <p className="mb-1 text-xs font-semibold">{message.senderName}</p>}
                        <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                        <time className={`mt-1 block text-right text-[10px] ${ownMessage ? 'text-indigo-100' : 'text-slate-400'}`} dateTime={message.createdAt}>
                          {new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(new Date(message.createdAt))}
                        </time>
                      </article>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleSend} className="border-t border-slate-100 p-3 sm:p-4">
                {messageError && <p role="alert" className="mb-2 text-sm text-red-700">{messageError}</p>}
                <label className="sr-only" htmlFor="message-draft">Write a message</label>
                <div className="flex items-end gap-2">
                  <textarea id="message-draft" rows="2" maxLength={2000} required value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Write a message about this listing…"
                    className="min-h-12 flex-1 resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                  <button type="submit" disabled={sending || !draft.trim()} className="btn-primary rounded-xl px-4 py-3 disabled:opacity-60">
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
