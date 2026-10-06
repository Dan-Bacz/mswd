import { db } from "../lib/db";

async function main() {
  const roles = ["ADMIN", "OFFICER"] as const;

  for (const name of roles) {
    await db.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const categories = [
    "Women Especially in Difficult Circumstances",
    "Children in Need of Special Protection",
    "Person with Disabilities (PWD)",
    "Senior Citizens",
    "Solo Parents",
    "CICL/CAR",
    "Assistance to Individuals in Crisis Situation (AICS)",
    "Disaster-Affected Families/Individuals",
    "VAWC Victims",
    "Point of Service and Medical Assistance to Indigent and Financially Incapacitated Patients (MAIFIP)",
    "ECCD - Children (3-5 years old)",
    "Women",
    "Juvenile",
  ];

  for (const name of categories) {
    await db.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const serviceTypes = [
    "Financial Assistance",
    "Medical Assistance",
    "Food Assistance",
    "Educational Assistance",
    "Psychosocial Support",
    "Counseling",
    "Referral",
    "Livelihood Assistance",
    "Emergency Assistance",
    "Home Visit",
    "Assessment",
    "Follow-up",
    "Other",
  ];

  for (const name of serviceTypes) {
    await db.serviceType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
