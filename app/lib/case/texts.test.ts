import { describe, expect, it } from "vitest";
import { formatCounter, texts } from "./texts";

const collectStrings = (node: unknown): string[] => {
  if (typeof node === "string") {
    return [node];
  }
  if (node && typeof node === "object") {
    return Object.values(node).flatMap(collectStrings);
  }
  return [];
};

describe("texts: validation copy (AC-05, AC-06, AC-07, AC-11, AC-12)", () => {
  it("AC-05 model name length message is verbatim", () => {
    expect(texts.validation.modelNameLength).toBe(
      "Podaj nazwę lub model sprzętu (min. 2 znaki)"
    );
  });

  it("AC-06 future purchase date message is verbatim", () => {
    expect(texts.validation.purchaseDateFuture).toBe(
      "Data zakupu nie może być z przyszłości"
    );
  });

  it("AC-07 complaint reason minimum message is verbatim", () => {
    expect(texts.validation.reasonComplaintMin).toBe(
      "Opisz problem (min. 20 znaków)"
    );
  });

  it("AC-11 photo format message and unsupported image type error are verbatim", () => {
    expect(texts.validation.photoFormat).toBe(
      "Dozwolone formaty: JPG, PNG, WebP"
    );
    expect(texts.errors.UNSUPPORTED_IMAGE_TYPE).toBe(
      "Dozwolone formaty: JPG, PNG, WebP"
    );
  });

  it("AC-12 photo too large message is verbatim", () => {
    expect(texts.validation.photoTooLarge).toBe(
      "Zdjęcie przekracza limit 10 MB"
    );
  });
});

describe("texts: photo hints (AC-14)", () => {
  it("AC-14 both photo hints are verbatim", () => {
    expect(texts.form.photo.hints.return).toBe(
      "Pokaż cały sprzęt z widocznym stanem obudowy i ekranu"
    );
    expect(texts.form.photo.hints.complaint).toBe(
      "Pokaż wyraźnie uszkodzenie lub wadę"
    );
  });
});

describe("texts: AI notice (AC-16)", () => {
  it("AC-16 AI notice is verbatim, uses em dash", () => {
    expect(texts.form.aiNotice).toBe(
      "Zgłoszenie oceni asystent AI. Ocena jest wstępna i niewiążąca — ostateczną decyzję podejmuje pracownik sklepu po oględzinach sprzętu."
    );
  });
});

describe("texts: processing labels (AC-18)", () => {
  it("AC-18 both processing labels are verbatim", () => {
    expect(texts.processing.analyzing).toBe("Analizujemy zdjęcie…");
    expect(texts.processing.deciding).toBe("Przygotowujemy decyzję…");
  });
});

describe("texts: submission failure (AC-22)", () => {
  it("AC-22 submission failure, analysis error and timeout messages and retry label are verbatim", () => {
    expect(texts.submission.failed).toBe(
      "Nie udało się przeanalizować zgłoszenia. Spróbuj ponownie."
    );
    expect(texts.errors.ANALYSIS_FAILED).toBe(
      "Nie udało się przeanalizować zgłoszenia. Spróbuj ponownie."
    );
    expect(texts.errors.ANALYSIS_TIMEOUT).toBe(
      "Nie udało się przeanalizować zgłoszenia. Spróbuj ponownie."
    );
    expect(texts.submission.retry).toBe("Spróbuj ponownie");
  });
});

describe("texts: decision labels (AC-25)", () => {
  it("AC-25 all four decision labels are verbatim", () => {
    expect(texts.decision.labels.accepted).toBe("Akceptacja (wstępna)");
    expect(texts.decision.labels.rejected).toBe("Odrzucenie (wstępne)");
    expect(texts.decision.labels.needs_info).toBe(
      "Potrzebne dodatkowe informacje"
    );
    expect(texts.decision.labels.escalated).toBe("Przekazanie do weryfikacji");
  });
});

describe("texts: decision disclaimer (AC-28)", () => {
  it("AC-28 disclaimer is verbatim, uses em dash", () => {
    expect(texts.decision.disclaimer).toBe(
      "To jest wstępna ocena przygotowana przez asystenta AI. Nie stanowi decyzji sklepu ani formalnego zgłoszenia. Ostateczną decyzję podejmuje pracownik sklepu po oględzinach sprzętu."
    );
  });
});

describe("texts: new case dialog (AC-50)", () => {
  it("AC-50 all four new case dialog strings are verbatim", () => {
    expect(texts.newCaseDialog.title).toBe("Rozpocząć nowe zgłoszenie?");
    expect(texts.newCaseDialog.description).toBe(
      "Obecna rozmowa zostanie utracona."
    );
    expect(texts.newCaseDialog.cancel).toBe("Anuluj");
    expect(texts.newCaseDialog.confirm).toBe("Rozpocznij nowe");
  });
});

describe("texts: option labels (AC-02, AC-03, AC-04)", () => {
  it("AC-02 case type option labels are verbatim", () => {
    expect(texts.form.caseType.options.return).toBe("Zwrot");
    expect(texts.form.caseType.options.complaint).toBe("Reklamacja");
  });

  it("AC-03 purchase channel option labels are verbatim", () => {
    expect(texts.form.purchaseChannel.options.online).toBe("Sklep internetowy");
    expect(texts.form.purchaseChannel.options.in_store).toBe(
      "Sklep stacjonarny"
    );
  });

  it("AC-04 all nine category labels appear in AC-04 order", () => {
    expect(Object.values(texts.form.category.options)).toEqual([
      "Smartfon",
      "Laptop",
      "Tablet",
      "Komputer stacjonarny",
      "Monitor",
      "Telewizor",
      "Słuchawki / audio",
      "Konsola do gier",
      "Inne",
    ]);
  });
});

describe("texts: PRD §9 copy", () => {
  it("product name is verbatim", () => {
    expect(texts.app.productName).toBe("Asystent zwrotów i reklamacji");
  });

  it("case type tile descriptions are verbatim", () => {
    expect(texts.form.caseType.descriptions.return).toBe(
      "Chcę oddać sprawny sprzęt"
    );
    expect(texts.form.caseType.descriptions.complaint).toBe(
      "Sprzęt ma wadę lub usterkę"
    );
  });

  it("model name placeholder is verbatim", () => {
    expect(texts.form.modelName.placeholder).toBe("np. Samsung Galaxy S24");
  });

  it("photo choose, remove and submit labels are verbatim", () => {
    expect(texts.form.photo.choose).toBe("Wybierz zdjęcie");
    expect(texts.form.photo.remove).toBe("Usuń");
    expect(texts.form.submit).toBe("Wyślij zgłoszenie");
  });

  it("chat assistant label and send/stop labels are verbatim", () => {
    expect(texts.chat.assistantLabel).toBe("Asystent AI");
    expect(texts.chat.send).toBe("Wyślij");
    expect(texts.chat.stop).toBe("Zatrzymaj");
  });

  it("new case, failed marker and retry labels are verbatim", () => {
    expect(texts.chat.newCase).toBe("Nowe zgłoszenie");
    expect(texts.chat.failedMarker).toBe("Nie wysłano");
    expect(texts.chat.retry).toBe("Ponów");
  });

  it("updated decision title and previous prefix are verbatim", () => {
    expect(texts.decision.updatedTitle).toBe("Zaktualizowana decyzja");
    expect(texts.decision.previousPrefix).toBe("poprzednio:");
  });
});

describe("texts: character checks", () => {
  it("processing.analyzing uses the single ellipsis character", () => {
    expect(texts.processing.analyzing.endsWith("…")).toBe(true);
    expect(texts.processing.analyzing.includes("...")).toBe(false);
  });

  it("aiNotice and disclaimer use no three-dot ellipsis", () => {
    expect(texts.form.aiNotice.includes("...")).toBe(false);
    expect(texts.decision.disclaimer.includes("...")).toBe(false);
  });

  it("aiNotice uses the em dash", () => {
    expect(texts.form.aiNotice.includes("—")).toBe(true);
  });
});

describe("formatCounter", () => {
  it("formats zero against the default max of 2000", () => {
    expect(formatCounter(0)).toBe("0 / 2000");
  });

  it("formats the maximum against the default max of 2000", () => {
    expect(formatCounter(2000)).toBe("2000 / 2000");
  });
});

describe("texts: structure", () => {
  it("every string value is non-empty and has no leading or trailing whitespace", () => {
    const strings = collectStrings(texts);
    expect(strings.length).toBeGreaterThan(0);
    for (const value of strings) {
      expect(value.length).toBeGreaterThan(0);
      expect(value).toBe(value.trim());
    }
  });
});
