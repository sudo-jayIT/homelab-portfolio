/** Hardware details supplied by the owner; CPU model awaits confirmation. */
export const PC_PARTS = {
  case: { label: "Case", title: "HYTE Y70 Touch", description: "Panoramic glass case with a vertical touchscreen." },
  motherboard: { label: "Motherboard", title: "ASUS TUF Gaming X870E-Plus WiFi", description: "The motherboard behind the CPU cooler, memory and graphics card." },
  cpu: { label: "CPU / AIO", title: "Corsair TITAN AIO with LCD", description: "Pale pump housing with a round LCD display and braided coolant tubes. Processor model awaiting owner confirmation." },
  ram: { label: "Memory", title: "64 GB Corsair Vengeance", description: "Two 32 GB memory modules." },
  gpu: { label: "Graphics", title: "MSI GeForce RTX 4080 Super", description: "Vertically mounted MSI graphics card with a silver angular shroud and three cooling fans." },
  storage: { label: "Storage", title: "4 TB Samsung 990 Pro", description: "NVMe storage beneath the motherboard’s M.2 heatsink." },
  fans: { label: "Fans", title: "Corsair fans", description: "Three RGB side fans with black X-shaped supports, a rear fan and top-mounted radiator fans." },
} as const;
export type PcPart = keyof typeof PC_PARTS;
