// Simple in-memory character library service
export class CharacterLibrary {
  private characters: string[] = [];

  addCharacter(name: string): void {
    if (!name) return;
    this.characters.push(name);
  }

  getCharacters(): string[] {
    return [...this.characters];
  }
}
