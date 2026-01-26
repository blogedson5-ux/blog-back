import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getMockUser } from "../utils/userMock.js";

const SECRET = process.env.SECRET_TOKEN;

export function createToken(user) {
  return jwt.sign(
    { _id: user._id, name: user.name, email: user.email },
    SECRET,
    { expiresIn: "30d" }
  );
}

function readToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    throw new Error("Token inválido");
  }
}

export function verifica(token) {
  if (!token) {
    throw new Error("Token não encontrado");
  }
  return readToken(token);
}

export const login = async (body) => {
  const mockUser = getMockUser();

  console.log(body);

  if (body.email !== mockUser.email) {
    throw new Error("Usuário inválido");
  }

  const passwordMatch = await bcrypt.compare(body.password, mockUser.password);

  if (!passwordMatch) {
    throw new Error("Senha incorreta");
  }

  const token = createToken(mockUser);
  return { token };
};

const senha = "Leo202020";

export const gerarSenha = async () => {
  bcrypt.genSalt(10, (err, salt) => {
    if (err) throw err;

    bcrypt.hash(senha, salt, (err, hash) => {
      if (err) throw err;

      console.log("Hash gerado:", hash);
    });
  });
};



/* Teste de poder */