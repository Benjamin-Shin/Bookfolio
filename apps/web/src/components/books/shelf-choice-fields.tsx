import {
  BOOK_FORMATS,
  BOOK_FORMAT_LABEL_KO,
  READING_STATUSES,
  READING_STATUS_LABEL_KO,
  type BookFormat,
  type ReadingStatus
} from "@bookfolio/shared";

import { cn } from "@/lib/utils";

const chipInput = "peer sr-only";

function chipSpan() {
  return cn(
    "inline-flex rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors",
    "hover:bg-muted/80 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
    "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
  );
}

function RadioChip({
  name,
  value,
  defaultChecked,
  label,
  required
}: {
  name: string;
  value: string;
  defaultChecked?: boolean;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        className={chipInput}
        defaultChecked={defaultChecked}
        required={required}
      />
      <span className={chipSpan()}>{label}</span>
    </label>
  );
}

export function BookFormatChoiceFieldset({
  name = "format",
  defaultFormat
}: {
  name?: string;
  defaultFormat: BookFormat;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium leading-none">형식</legend>
      <div className="flex flex-wrap gap-2">
        {BOOK_FORMATS.map((f, i) => (
          <RadioChip
            key={f}
            name={name}
            value={f}
            label={BOOK_FORMAT_LABEL_KO[f]}
            defaultChecked={defaultFormat === f}
            required={i === 0}
          />
        ))}
      </div>
    </fieldset>
  );
}

export function ReadingStatusChoiceFieldset({
  name = "readingStatus",
  defaultStatus
}: {
  name?: string;
  defaultStatus: ReadingStatus;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium leading-none">읽기 상태</legend>
      <div className="flex flex-wrap gap-2">
        {READING_STATUSES.map((s, i) => (
          <RadioChip
            key={s}
            name={name}
            value={s}
            label={READING_STATUS_LABEL_KO[s]}
            defaultChecked={defaultStatus === s}
            required={i === 0}
          />
        ))}
      </div>
    </fieldset>
  );
}

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

export function RatingChoiceFieldset({
  name = "rating",
  defaultRating
}: {
  name?: string;
  defaultRating: number | null;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium leading-none">평점</legend>
      <p className="text-xs text-muted-foreground">클릭만으로 선택합니다. 없음이면 평점을 저장하지 않습니다.</p>
      <div className="flex flex-wrap gap-2">
        <RadioChip name={name} value="" label="없음" defaultChecked={defaultRating == null} />
        {RATING_VALUES.map((n) => (
          <RadioChip
            key={n}
            name={name}
            value={String(n)}
            label={`${n}점`}
            defaultChecked={defaultRating === n}
          />
        ))}
      </div>
    </fieldset>
  );
}
