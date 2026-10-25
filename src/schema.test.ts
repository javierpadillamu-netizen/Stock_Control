import { describe, expect, it } from "vitest";
import { LISTS, optionsFor, validate } from "./schema";
import { draftToFields } from "./form";
import { editedRecordFields, newRecordFields } from "./data/store";

const irrigation = LISTS.irrigation;

describe("validate", () => {
  it("acepta un registro completo de Irrigation", () => {
    const ok = { Fecha: "2026-10-25", HoraInicio: "07:00", HoraTermino: "09:30", Area: "Argyle", Subarea: "B1", Ml: 1.25 };
    expect(validate(irrigation, ok)).toEqual({});
  });

  it("rechaza una subárea que no es del área elegida", () => {
    const bad = { Fecha: "2026-10-25", HoraInicio: "07:00", HoraTermino: "09:30", Area: "Argyle", Subarea: "C1", Ml: 1 };
    expect(validate(irrigation, bad)).toHaveProperty("Subarea");
  });

  it("marca datos faltantes, horas mal escritas y números negativos", () => {
    const errs = validate(LISTS.river, { Fecha: "2026-10-25", Hora: "7:5", Ml: -1 });
    expect(Object.keys(errs).sort()).toEqual(["Hora", "Ml"]);
    expect(validate(LISTS.stock, { Fecha: "2026-10-25", Turno: "", Producto: "Tallow (MST)", StockTn: 3 })).toHaveProperty("Turno");
  });
});

describe("optionsFor", () => {
  it("muestra solo las subáreas del área elegida", () => {
    const sub = irrigation.fields.find((f) => f.key === "Subarea")!;
    expect(optionsFor(sub, { Area: "Swan Gully North" })).toEqual(["H2", "H3", "I2", "J2"]);
    expect(optionsFor(sub, {})).toEqual([]);
  });
});

describe("draftToFields", () => {
  it("acepta coma decimal", () => {
    expect(draftToFields(LISTS.river, { Fecha: "2026-10-25", Hora: "08:00", Ml: "1,5" }).Ml).toBe(1.5);
  });
});

describe("campos de control", () => {
  it("un registro nuevo no está modificado", () => {
    expect(newRecordFields({ Ml: 1 }, "Ana")).toMatchObject({ Title: "Ana", Modificado: false, ModificadoPor: null });
  });

  it("una edición marca quién y cuándo", () => {
    const now = new Date("2026-10-25T10:00:00Z");
    expect(editedRecordFields({ Ml: 2 }, "Luis", now)).toEqual({
      Ml: 2,
      Modificado: true,
      ModificadoPor: "Luis",
      FechaModificacion: "2026-10-25T10:00:00.000Z",
    });
  });
});
