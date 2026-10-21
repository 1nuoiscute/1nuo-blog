// Exact site-owner rules; contextual homophones are also covered by the model policy.
export function hasBlockedTerm(value) {
  const text = String(value).normalize('NFKC').toLowerCase();
  const compact = text.replace(/[\s\p{P}\p{S}\p{Cf}]/gu, '');
  return /申[浩昊皓灏豪][辰晨宸]/u.test(compact) ||
    /(?:^|[^a-z0-9])s[\s\p{P}\p{S}\p{Cf}]*h[\s\p{P}\p{S}\p{Cf}]*c(?=$|[^a-z0-9])/u.test(text) ||
    /(?:^|[^a-z])shen[\s\p{P}\p{S}\p{Cf}]*hao[\s\p{P}\p{S}\p{Cf}]*chen(?=$|[^a-z])/u.test(text);
}
export function checkContent(value, reject) { if (hasBlockedTerm(value)) reject(400, '内容包含本站屏蔽词，请修改后发布'); }
