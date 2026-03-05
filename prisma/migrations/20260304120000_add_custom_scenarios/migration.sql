-- CreateTable
CREATE TABLE "custom_scenarios" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prospect_name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "call_goal" TEXT NOT NULL,
    "prospect_type" TEXT NOT NULL,
    "personality" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "objections" TEXT NOT NULL,
    "constraints" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'normal',
    "locale" TEXT NOT NULL DEFAULT 'es-ES',
    "tone" TEXT NOT NULL DEFAULT 'formal',
    "generated_prompt" TEXT NOT NULL,
    "prep_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_scenarios_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "custom_scenarios" ADD CONSTRAINT "custom_scenarios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
