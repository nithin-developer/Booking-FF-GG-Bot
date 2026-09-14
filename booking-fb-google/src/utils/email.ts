/**
 * Get the user's email from URL params first, then sessionStorage fallback.
 * This ensures the email entered on the Landing page flows through all pages
 * even when the page is navigated to without an explicit ?email= param.
 */
export function getSessionEmail(searchParams: URLSearchParams, fallback = ''): string {
  return (
    searchParams.get('email') ||
    sessionStorage.getItem('user_email') ||
    fallback
  );
}
