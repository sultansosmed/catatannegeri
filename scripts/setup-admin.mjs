import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

async function main() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || "redaksi@catatannegeri.com").trim().toLowerCase();
  const password = (args[1] || process.env.ADMIN_PASSWORD || "Admin123!CatatanNegeri").trim();
  const name = (args[2] || process.env.ADMIN_NAME || "Tim Redaksi Catatan Negeri").trim();

  console.log("==================================================");
  console.log(" Catatan Negeri — Initial Administrator Setup     ");
  console.log("==================================================");
  console.log(`Setting up administrator: ${email}`);

  if (password.length < 8) {
    console.error("Error: Kata sandi minimal harus 8 karakter.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { authorProfile: true },
  });

  let user;
  if (existingUser) {
    user = await prisma.user.update({
      where: { email },
      data: {
        name,
        passwordHash,
        role: Role.SUPER_ADMIN,
        isActive: true,
      },
      include: { authorProfile: true },
    });
    console.log(`✔ Akun administrator "${email}" berhasil diperbarui dengan status SUPER_ADMIN.`);
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: Role.SUPER_ADMIN,
        isActive: true,
        authorProfile: {
          create: {
            displayName: name,
            slug: email.split("@")[0].replace(/[^a-z0-9]/g, "-"),
            title: "Administrator Utama",
            bio: "Pengelola sistem dan dewan redaksi Catatan Negeri.",
            isPublic: true,
          },
        },
      },
      include: { authorProfile: true },
    });
    console.log(`✔ Akun administrator baru "${email}" berhasil dibuat dengan status SUPER_ADMIN.`);
  }

  if (!user.authorProfile) {
    await prisma.authorProfile.create({
      data: {
        userId: user.id,
        displayName: name,
        slug: email.split("@")[0].replace(/[^a-z0-9]/g, "-"),
        title: "Administrator Utama",
        bio: "Pengelola sistem dan dewan redaksi Catatan Negeri.",
        isPublic: true,
      },
    });
    console.log(`✔ Profil penulis untuk administrator berhasil dibuat.`);
  }

  console.log("--------------------------------------------------");
  console.log(" Kredensial Administrator Aktif:");
  console.log(` - Email       : ${email}`);
  console.log(` - Password    : ${password}`);
  console.log(` - Role        : SUPER_ADMIN`);
  console.log(` - Halaman     : /admin/login`);
  console.log("==================================================");
}

main()
  .catch((err) => {
    console.error("Gagal melakukan konfigurasi administrator:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

