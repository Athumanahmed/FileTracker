import prisma from "../../config/prisma.js";

const REVIEW_ACTIONS = ["FORWARD", "RETURN", "REASSIGN", "APPROVE", "REJECT", "REQUEST_INFORMATION", "HOLD", "RESUME"];
const FINAL_ACTIONS = ["APPROVE", "REJECT", "REQUEST_INFORMATION", "HOLD", "RESUME", "COMPLETE", "CLOSE"];

export async function seedWorkflowTemplates() {
  console.log("Seeding workflow templates...");

  const [directorRole, hodRole, supervisorRole, officerRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { code: "DIRECTOR" } }),
    prisma.role.findUniqueOrThrow({ where: { code: "HOD" } }),
    prisma.role.findUniqueOrThrow({ where: { code: "SUPERVISOR" } }),
    prisma.role.findUniqueOrThrow({ where: { code: "OFFICER" } }),
  ]);

  const template = await prisma.workflowTemplate.upsert({
    where: { code: "DIR_HOD_SUP_OFF" },
    update: {},
    create: {
      code: "DIR_HOD_SUP_OFF",
      name: "Director - HOD - Supervisor - Officer Routing",
      description: "Standard four-step routing chain used for general case files.",
      isActive: true,
    },
  });

  const steps = [
    { stepOrder: 1, name: "Director Review", requiredRoleId: directorRole.id, slaHours: 48, isFinalStep: false, allowedActions: REVIEW_ACTIONS },
    { stepOrder: 2, name: "HOD Review", requiredRoleId: hodRole.id, slaHours: 48, isFinalStep: false, allowedActions: REVIEW_ACTIONS },
    { stepOrder: 3, name: "Supervisor Review", requiredRoleId: supervisorRole.id, slaHours: 48, isFinalStep: false, allowedActions: REVIEW_ACTIONS },
    { stepOrder: 4, name: "Officer Action", requiredRoleId: officerRole.id, slaHours: 72, isFinalStep: true, allowedActions: FINAL_ACTIONS },
  ];

  for (const step of steps) {
    await prisma.workflowStep.upsert({
      where: { templateId_stepOrder: { templateId: template.id, stepOrder: step.stepOrder } },
      update: {},
      create: { ...step, templateId: template.id },
    });
  }

  console.log("Workflow templates seeded.");
}
