CREATE TABLE "UserFitnessProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "primaryGoal" TEXT NOT NULL,
    "secondaryGoal" TEXT,
    "experienceLevel" TEXT NOT NULL,
    "trainingDaysPerWeek" INTEGER NOT NULL,
    "loadLevel" TEXT NOT NULL,
    "gender" TEXT,
    "equipmentAccess" TEXT NOT NULL,
    "planStatus" TEXT NOT NULL DEFAULT 'needs_onboarding',
    "draftPlanPayload" JSONB,
    "planVersion" INTEGER NOT NULL DEFAULT 1,
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFitnessProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserFitnessProfile_userId_key" ON "UserFitnessProfile"("userId");
CREATE INDEX "UserFitnessProfile_planStatus_idx" ON "UserFitnessProfile"("planStatus");

ALTER TABLE "UserFitnessProfile"
ADD CONSTRAINT "UserFitnessProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
