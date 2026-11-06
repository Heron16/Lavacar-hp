import { ResultadoPaginado, ConsultaPaginacao } from '../types';

export function paginate<T>(dados: T[], total: number, pagina: number, limite: number): ResultadoPaginado<T> {
  return {
    dados,
    total,
    pagina,
    totalPaginas: Math.ceil(total / limite),
  };
}

export function getPaginationParams(pagina?: number, limite?: number) {
  const currentPage = Math.max(1, pagina || 1);
  const pageLimit = Math.min(50, Math.max(1, limite || 10));
  const skip = (currentPage - 1) * pageLimit;
  return { currentPage, pageLimit, skip };
}
