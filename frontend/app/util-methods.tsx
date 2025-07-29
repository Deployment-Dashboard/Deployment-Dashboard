export function equalsCaseInsensitive(str1: string, str2: string)  {
  const collator = new Intl.Collator(undefined, { sensitivity: "base" });

  return collator.compare(str1.trim(), str2.trim()) === 0;
}
