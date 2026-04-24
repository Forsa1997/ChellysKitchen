// Slug Service
export class SlugService {
  static generate(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static generateUnique(baseSlug: string, existingSlugs: string[]): string {
    let slug = this.generate(baseSlug);
    let counter = 1;

    while (existingSlugs.includes(slug)) {
      slug = `${this.generate(baseSlug)}-${counter}`;
      counter++;
    }

    return slug;
  }
}