import { describe, expect, it } from "vitest";
import { LISTS, lastReading, optionsFor, usageOf, validate } from "./schema";
import { draftToFields } from "./form";
import { editedRecordFields, newRecordFields } from "./data/store";

const irrigation = LISTS.irrigation;

describe("validate", () => {
  it("acepta un registro completo de Irrigation", () => {
    const ok = { Fecha: "2026-10-25", HoraInicio: "07:00", HoraTermino: "09:30", Pond: "8", Area: "Argyle", Subarea: "B1", LecturaAnterior: 10, LecturaActual: 11.25 };
    expect(validate(irrigation, ok)).toEqual({});
  });

  it("rechaza una subárea que no es del área elegida", () => {
    const bad = { Fecha: "2026-10-25", HoraInicio: "07:00", HoraTermino: "09:30", Pond: "8", Area: "Argyle", Subarea: "C1", LecturaAnterior: 0, LecturaActual: 1 };
    expect(validate(irrigation, bad)).toHaveProperty("Subarea");
  });

  it("exige el Pond en Irrigation y solo acepta 8 o 9", () => {
    const base = { Fecha: "2026-10-25", HoraInicio: "07:00", HoraTermino: "09:30", Area: "Argyle", Subarea: "B1", LecturaAnterior: 0, LecturaActual: 1 };
    expect(validate(irrigation, base)).toHaveProperty("Pond");
    expect(validate(irrigation, { ...base, Pond: "7" })).toHaveProperty("Pond");
  });

  it("marca datos faltantes, horas mal escritas y números negativos", () => {
    const errs = validate(LISTS.river, { Fecha: "2026-10-25", Hora: "7:5", Ml: -1 });
    expect(Object.keys(errs).sort()).toEqual(["Hora", "Ml"]);
    expect(validate(LISTS.productionStock, { Fecha: "2026-10-25", Turno: "", Almacenamiento: "Container", Producto: "Tallow (MST)", StockTn: 3 })).toHaveProperty("Turno");
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
    expect(newRecordFields({ Ml: 1 }, { uid: "u1", name: "Ana" })).toMatchObject({
      Title: "Ana",
      createdBy: "u1",
      Modificado: false,
      ModificadoPor: null,
    });
  });

  it("una edición marca quién y cuándo", () => {
    const now = new Date("2026-10-25T10:00:00Z");
    expect(editedRecordFields({ Ml: 2 }, { uid: "u2", name: "Luis" }, now)).toEqual({
      Ml: 2,
      Modificado: true,
      ModificadoPor: "Luis",
      modifiedBy: "u2",
      FechaModificacion: "2026-10-25T10:00:00.000Z",
    });
  });
});

describe("stock por almacenamiento", () => {
  const stock = LISTS.productionStock;
  const base = { Fecha: "2026-10-26", Turno: "Am", StockTn: 5 };

  it("el producto depende del almacenamiento", () => {
    const producto = stock.fields.find((f) => f.key === "Producto")!;
    expect(optionsFor(producto, { Almacenamiento: "Cake Bin" })).toEqual(["Poultry Meal (PM)", "Mixed Species (MBM)", "Feather Meal (FM)"]);
    expect(optionsFor(producto, { Almacenamiento: "Silo" })).toContain("MBM 2");
    expect(optionsFor(producto, { Almacenamiento: "Container" })).toHaveLength(6);
    expect(optionsFor(producto, {})).toEqual([]);
  });

  it("acepta hasta la capacidad y rechaza lo que la supera", () => {
    expect(validate(stock, { ...base, Almacenamiento: "Cake Bin", Producto: "Poultry Meal (PM)", StockTn: 10 })).toEqual({});
    expect(validate(stock, { ...base, Almacenamiento: "Cake Bin", Producto: "Poultry Meal (PM)", StockTn: 10.5 })).toHaveProperty("StockTn");
    expect(validate(stock, { ...base, Almacenamiento: "Silo", Producto: "Ingham", StockTn: 70 })).toEqual({});
    expect(validate(stock, { ...base, Almacenamiento: "Silo", Producto: "Feather", StockTn: 51 })).toHaveProperty("StockTn");
  });

  it("Stock Onhand usa los mismos campos que Production Stock", () => {
    expect(LISTS.stockOnhand.fields).toBe(LISTS.productionStock.fields);
    expect(LISTS.stockOnhand.flow).toBe("Stock");
  });

  it("Bulk Bags y Container no tienen límite", () => {
    expect(validate(stock, { ...base, Almacenamiento: "Bulk Bags", Producto: "Tallow (MST)", StockTn: 500 })).toEqual({});
  });

  it("un producto de Cake Bin que no corresponde se rechaza", () => {
    expect(validate(stock, { ...base, Almacenamiento: "Cake Bin", Producto: "Tallow (MST)" })).toHaveProperty("Producto");
  });
});

describe("lecturas de Irrigation", () => {
  const base = { Fecha: "2026-10-25", HoraInicio: "07:00", HoraTermino: "09:30", Pond: "8", Area: "Argyle", Subarea: "B1" };
  const rec = (id: string, fields: Record<string, string | number>, created = "2026-10-25T10:00:00Z") => ({ id, created, fields: { ...base, ...fields } });

  it("exige ambas lecturas y que la actual no sea menor que la anterior", () => {
    expect(validate(irrigation, { ...base, LecturaAnterior: 100, LecturaActual: 120.5 })).toEqual({});
    expect(validate(irrigation, { ...base, LecturaAnterior: 100 })).toHaveProperty("LecturaActual");
    expect(validate(irrigation, { ...base, LecturaAnterior: 100, LecturaActual: 90 })).toHaveProperty("LecturaActual");
  });

  it("calcula el consumo y usa Ml en registros antiguos", () => {
    expect(usageOf(irrigation, { LecturaAnterior: 100.1, LecturaActual: 120.3 })).toBe(20.2);
    expect(usageOf(irrigation, { Ml: 3 })).toBe(3);
    expect(usageOf(irrigation, {})).toBeNull();
  });

  it("encuentra la última lectura del mismo Pond, Area y Sub-area", () => {
    const items = [
      rec("a", { Fecha: "2026-10-24", LecturaActual: 100 }),
      rec("b", { Fecha: "2026-10-26", LecturaActual: 150 }),
      rec("c", { Fecha: "2026-10-27", Subarea: "B2", LecturaActual: 999 }),
      rec("d", { Fecha: "2026-10-27", Pond: "9", LecturaActual: 888 }),
      rec("e", { Fecha: "2026-10-26", HoraTermino: "08:00", LecturaActual: 140 }),
    ];
    expect(lastReading(irrigation, items, base)?.id).toBe("b");
    expect(lastReading(irrigation, items, { ...base, Subarea: "B3" })).toBeNull();
    expect(lastReading(irrigation, items, { ...base, Subarea: "" })).toBeNull();
  });
});
