export const REASON_MAX = 2000;
export const formatCounter = (
  count: number,
  max: number = REASON_MAX
): string => `${count} / ${max}`;

export const texts = {
  app: {
    intro:
      "Opisz swój zwrot lub reklamację i dodaj zdjęcie sprzętu — otrzymasz wstępną ocenę zgłoszenia.",
    logoAlt: "x-kom",
    productName: "Asystent zwrotów i reklamacji",
  },
  chat: {
    assistantLabel: "Asystent AI",
    failedMarker: "Nie wysłano",
    followUpFailed: "Nie udało się wysłać wiadomości.",
    hiddenSubmissionText: "Przesłano zgłoszenie.",
    inputLabel: "Wiadomość do asystenta",
    inputPlaceholder: "Napisz wiadomość…",
    interrupted: "Odpowiedź została przerwana.",
    newCase: "Nowe zgłoszenie",
    retry: "Ponów",
    scrollToBottom: "Przewiń do najnowszej wiadomości",
    send: "Wyślij",
    stop: "Zatrzymaj",
    typing: "Asystent pisze…",
  },
  decision: {
    disclaimer:
      "To jest wstępna ocena przygotowana przez asystenta AI. Nie stanowi decyzji sklepu ani formalnego zgłoszenia. Ostateczną decyzję podejmuje pracownik sklepu po oględzinach sprzętu.",
    labels: {
      accepted: "Akceptacja (wstępna)",
      escalated: "Przekazanie do weryfikacji",
      needs_info: "Potrzebne dodatkowe informacje",
      rejected: "Odrzucenie (wstępne)",
    },
    pending: "Przygotowujemy decyzję…",
    previousPrefix: "poprzednio:",
    title: "Decyzja",
    updatedTitle: "Zaktualizowana decyzja",
    updateReminder:
      "Ocena nadal jest wstępna — ostateczną decyzję podejmuje pracownik sklepu po oględzinach sprzętu.",
  },
  errors: {
    ANALYSIS_FAILED:
      "Nie udało się przeanalizować zgłoszenia. Spróbuj ponownie.",
    ANALYSIS_TIMEOUT:
      "Nie udało się przeanalizować zgłoszenia. Spróbuj ponownie.",
    CONFIGURATION_ERROR: "Usługa jest chwilowo niedostępna.",
    NOT_IMPLEMENTED: "Usługa jest chwilowo niedostępna.",
    PHOTO_REQUIRED: "Dodaj zdjęcie sprzętu.",
    PHOTO_TOO_LARGE: "Zdjęcie po zmniejszeniu przekracza 1 MB.",
    REQUEST_TOO_LARGE:
      "Rozmowa jest zbyt długa, aby ją kontynuować. Rozpocznij nowe zgłoszenie.",
    UNSUPPORTED_CONTENT_TYPE: "Nieobsługiwany format żądania.",
    UNSUPPORTED_IMAGE_TYPE: "Dozwolone formaty: JPG, PNG, WebP",
    VALIDATION_ERROR: "Nieprawidłowe dane zgłoszenia.",
  },
  form: {
    aiNotice:
      "Zgłoszenie oceni asystent AI. Ocena jest wstępna i niewiążąca — ostateczną decyzję podejmuje pracownik sklepu po oględzinach sprzętu.",
    caseType: {
      descriptions: {
        complaint: "Sprzęt ma wadę lub usterkę",
        return: "Chcę oddać sprawny sprzęt",
      },
      label: "Rodzaj zgłoszenia",
      options: { complaint: "Reklamacja", return: "Zwrot" },
    },
    category: {
      label: "Kategoria sprzętu",
      // biome-ignore assist/source/useSortedKeys: order matches AC-04
      options: {
        smartphone: "Smartfon",
        laptop: "Laptop",
        tablet: "Tablet",
        desktop: "Komputer stacjonarny",
        monitor: "Monitor",
        tv: "Telewizor",
        audio: "Słuchawki / audio",
        console: "Konsola do gier",
        other: "Inne",
      },
      placeholder: "Wybierz kategorię",
    },
    modelName: {
      label: "Nazwa lub model sprzętu",
      placeholder: "np. Samsung Galaxy S24",
    },
    photo: {
      choose: "Wybierz zdjęcie",
      dropHint: "lub przeciągnij plik tutaj",
      formatHint: "JPG, PNG lub WebP, maks. 10 MB",
      hints: {
        complaint: "Pokaż wyraźnie uszkodzenie lub wadę",
        return: "Pokaż cały sprzęt z widocznym stanem obudowy i ekranu",
      },
      label: "Zdjęcie sprzętu",
      previewAlt: "Podgląd wybranego zdjęcia",
      remove: "Usuń",
    },
    purchaseChannel: {
      label: "Miejsce zakupu",
      options: { in_store: "Sklep stacjonarny", online: "Sklep internetowy" },
    },
    purchaseDate: { label: "Data zakupu" },
    reason: {
      labelComplaint: "Opisz problem",
      labelReturn: "Powód zwrotu (opcjonalnie)",
    },
    requiredMarker: "*",
    submit: "Wyślij zgłoszenie",
  },
  newCaseDialog: {
    cancel: "Anuluj",
    confirm: "Rozpocznij nowe",
    description: "Obecna rozmowa zostanie utracona.",
    title: "Rozpocząć nowe zgłoszenie?",
  },
  processing: {
    analyzing: "Analizujemy zdjęcie…",
    deciding: "Przygotowujemy decyzję…",
  },
  submission: {
    dismiss: "Zamknij",
    failed: "Nie udało się przeanalizować zgłoszenia. Spróbuj ponownie.",
    retry: "Spróbuj ponownie",
  },
  summary: {
    caseType: "Rodzaj zgłoszenia",
    category: "Kategoria",
    currentDecision: "Aktualna decyzja",
    daysSincePurchase: "Dni od zakupu",
    empty: "—",
    heading: "Twoje zgłoszenie",
    modelName: "Model",
    photo: "Zdjęcie",
    photoAlt: "Zdjęcie zgłoszonego sprzętu",
    photoClose: "Zamknij",
    photoOpen: "Powiększ zdjęcie",
    purchaseChannel: "Miejsce zakupu",
    purchaseDate: "Data zakupu",
    reason: "Powód",
    toggle: "Szczegóły zgłoszenia",
  },
  validation: {
    caseTypeRequired: "Wybierz rodzaj zgłoszenia",
    categoryRequired: "Wybierz kategorię sprzętu",
    modelNameLength: "Podaj nazwę lub model sprzętu (min. 2 znaki)",
    photoFormat: "Dozwolone formaty: JPG, PNG, WebP",
    photoRequired: "Dodaj zdjęcie sprzętu.",
    photoTooLarge: "Zdjęcie przekracza limit 10 MB",
    purchaseChannelRequired: "Wybierz miejsce zakupu",
    purchaseDateFuture: "Data zakupu nie może być z przyszłości",
    purchaseDateRequired: "Podaj datę zakupu",
    reasonComplaintMin: "Opisz problem (min. 20 znaków)",
    reasonTooLong: "Opis może mieć maksymalnie 2000 znaków",
  },
} as const;

export type Texts = typeof texts;
