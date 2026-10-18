# Uprawnienia GitHub Copilot CLI  -  przykład

Uruchom z katalogu repozytorium:

```powershell
& .\course-materials\agent-configs\copilot\start-copilot.ps1
```

Na Linux/macOS:

```bash
bash course-materials/agent-configs/copilot/start-copilot.sh
```

Przykład automatycznie zatwierdza cztery polecenia do przeglądania zmian i historii Git (`status`, `diff`, `log`, `show`). Odrzuca bez pytania wskazane prefiksy pushów do `main`, `master` i `prod` oraz force-pushów, a także m.in. `git reset`, `git clean` i zapis plików `.env`. Uczestnicy mogą wypychać własne gałęzie i otwierać PR-y; pozostałe działania nie dostają dodatkowej zgody z tego przykładu, więc Copilot stosuje zwykłe reguły i wcześniej zapisane decyzje. Reguły obowiązują tylko w sesji uruchomionej tym skryptem. Możesz przekazać własne argumenty do `copilot` po nazwie skryptu.

Oba skrypty mają identyczne 69 prefiksów odmowy dla pushów: 30 wariantów chronionych gałęzi na `origin`/`upstream`, z `-u`/`--set-upstream` przed lub po nazwie zdalnego repozytorium, oraz 39 wariantów z `--force`, `-f` lub `--force-with-lease`. Przykładowa reguła to `--deny-tool='shell(git push origin main:*)'`. Dokumentacja potwierdza końcowe `:*`, nie dowolne wildcardy wewnątrz polecenia. Same prefiksy mogą przepuścić `git push` na aktywnej chronionej gałęzi, `HEAD:main`, inne nazwy repozytoriów, kolejności opcji i późniejsze flagi force. Ochrona gałęzi w GitHub/Bitbucket jest właściwym zabezpieczeniem; zobacz [porównanie narzędzi](../README.md#protected-branch-push-policy). Agent do przeglądu bez nadzoru nadal ma zakaz wszystkich pushów.

To **reguły zgód CLI**, a nie izolacja procesu. Nie traktuj ich jako ochrony sekretów przed dowolnym poleceniem powłoki. Dla pracy bez nadzoru użyj także [piaskownicy Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/overview#use-sandboxing) albo odizolowanego środowiska.

Składnia Copilota to `shell(git status:*)`, a nie składnia Claude Code `Bash(git status:*)`. Copilot CLI obecnie nie obsługuje współdzielonych list `allow`/`deny` w `.github/copilot/settings.json`: nieznane klucze repozytorium są ignorowane. Lokalny `~/.copilot/permissions-config.json` zapisuje tylko zatwierdzenia przypisane do bezwzględnej ścieżki repozytorium; nie obsługuje reguł odmowy ani przenośnej konfiguracji dla zespołu. Dlatego przykład używa flag `--allow-tool` i `--deny-tool` przy starcie.

Sprawdzone z Copilot CLI 1.0.88 przed zmianą polityki: `git status --short` wykonał się bez pytania, a wcześniejszy zakaz wszystkich pushów odrzucił `git push --help`. Obecna polityka nie blokuje tego prefiksu. Skrypty mają zgodne argumenty; rzeczywiste egzekwowanie nowych reguł trzeba sprawdzić na wersji uczestnika, ponieważ samo parsowanie konfiguracji tego nie potwierdza.

Źródła: [reguły narzędzi](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/allowing-tools), [zakres ustawień i zapisanych zgód](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference), [składnia poleceń](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference).
