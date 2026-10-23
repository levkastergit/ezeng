/** Real recordings of the bundled songs: freely licensed files from Wikimedia Commons, converted to public/songs/<id>.mp3. */
export interface SongAudio {
  file: string;
  /** Performer and licence, shown under the player. */
  credit: string;
  license: string;
  /** Wikimedia Commons file page. */
  source: string;
  /** Warnings worth knowing before listening. */
  note?: string;
}

const C = 'https://commons.wikimedia.org/wiki/File:';

export const songAudio: Record<string, SongAudio> = {
  s01: { file: 's01.mp3', credit: 'Dcoetzee, a cappella, полный текст', license: 'CC0', source: C + 'Twinkle_Twinkle_Little_Star_-_sung_with_full_lyrics.ogg', note: 'Любительская запись без аккомпанемента.' },
  s02: { file: 's02.mp3', credit: 'Alexander Stephens, аудиокнига mylingo', license: 'CC BY-SA 3.0', source: C + 'Happy_birthday.ogg', note: 'Поётся на немецком и английском языках.' },
  s03: { file: 's03.mp3', credit: 'Starlifter and Roots in Blue, U.S. Air Force Band of Mid-America, 2020', license: 'public domain', source: C + 'Jingle_Bells_(2020)_-_Starlifter_and_Roots_in_Blue_-_United_States_Air_Force_Band_of_Mid-America.mp3' },
  s04: { file: 's04.mp3', credit: 'Haydn Quartet, запись 1901 года, Библиотека Конгресса США', license: 'public domain', source: C + 'My_Bonnie_lies_over_the_ocean_(Haydn_Quartet,_1901).mp3', note: 'Историческая запись: слышны шумы граммофона.' },
  s05: { file: 's05.mp3', credit: 'U.S. Navy Band, аранжировка Ralph Martino', license: 'public domain', source: C + 'Oh_Susanna.ogg', note: 'Инструментальная версия для духового оркестра, без вокала.' },
  s06: { file: 's06.mp3', credit: 'U.S. Air Force Band, джазовая вокальная версия', license: 'public domain', source: C + 'Amazing_Grace_(USAFB_jazz_vocal).ogg' },
  s07: { file: 's07.mp3', credit: 'Makemi, народное исполнение', license: 'CC BY-SA 3.0', source: C + 'Scarborough_Fair.ogg' },
  s08: { file: 's08.mp3', credit: 'Emilio Villalba и Sara Marina, альбом La Pequeña Juglaresa, 2020', license: 'CC BY 3.0', source: C + 'Greensleeves._La_Juglaresa.opus', note: 'Исполнение ансамбля старинной музыки.' },
  s09: { file: 's09.mp3', credit: 'Starlifter and Roots in Blue, U.S. Air Force Band of Mid-America, 2020', license: 'public domain', source: C + 'Auld_Land_Syne_(2020)_-_Starlifter_and_Roots_in_Blue_-_United_States_Air_Force_Band_of_Mid-America.mp3' },
  s10: { file: 's10.mp3', credit: 'Grant Raymond Barrett, 2006', license: 'CC BY 3.0', source: C + "01_When_The_Saints_Go_Marchin'_In.ogg" },
  s11: { file: 's11.mp3', credit: 'фрагмент из трейлера фильма «Моя дорогая Клементина», 1946', license: 'public domain', source: C + 'My_Darling_Clementine_1946_-_trailer_-_Fragment.wav', note: 'Короткий фрагмент (30 секунд).' },
  s12: { file: 's12.mp3', credit: 'James Richardson, полевая запись, Библиотека Конгресса США', license: 'public domain', source: C + 'Home_on_the_range.ogg', note: 'Историческая полевая запись.' },
};
