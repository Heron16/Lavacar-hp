import { paginate, getPaginationParams } from '../../utils/pagination';

describe('paginate', () => {
  it('monta o resultado paginado com dados, total, pagina e totalPaginas', () => {
    const resultado = paginate([1, 2, 3], 30, 2, 10);
    expect(resultado).toEqual({ dados: [1, 2, 3], total: 30, pagina: 2, totalPaginas: 3 });
  });

  it('calcula totalPaginas arredondando para cima', () => {
    expect(paginate([1], 25, 1, 10).totalPaginas).toBe(3);
    expect(paginate([], 0, 1, 10).totalPaginas).toBe(0);
  });
});

describe('getPaginationParams', () => {
  it('usa defaults (pagina=1, limite=10) quando nada é informado', () => {
    expect(getPaginationParams()).toEqual({ currentPage: 1, pageLimit: 10, skip: 0 });
  });

  it('calcula skip = (pagina - 1) * limite', () => {
    expect(getPaginationParams(3, 10)).toEqual({ currentPage: 3, pageLimit: 10, skip: 20 });
    expect(getPaginationParams(5, 20)).toEqual({ currentPage: 5, pageLimit: 20, skip: 80 });
  });

  it('limita o pageLimit ao teto de 50', () => {
    expect(getPaginationParams(1, 100)).toEqual({ currentPage: 1, pageLimit: 50, skip: 0 });
  });

  it('não permite página menor que 1', () => {
    expect(getPaginationParams(0, 10)).toEqual({ currentPage: 1, pageLimit: 10, skip: 0 });
    expect(getPaginationParams(-5, 10)).toEqual({ currentPage: 1, pageLimit: 10, skip: 0 });
  });

  it('trata limite 0 como não informado (usa default 10)', () => {
    expect(getPaginationParams(1, 0)).toEqual({ currentPage: 1, pageLimit: 10, skip: 0 });
  });

  it('não permite limite negativo (floor em 1)', () => {
    expect(getPaginationParams(1, -3)).toEqual({ currentPage: 1, pageLimit: 1, skip: 0 });
  });
});
