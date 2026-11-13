document.addEventListener('DOMContentLoaded', iniciarMural);

function iniciarMural() {
  try {
    const form = document.getElementById('form-mural');
    const lista = document.getElementById('lista-registros');

    if (!form || !lista) return;

    const estado = {
      registros: [],
      atividades: [],
      proximoId: 1
    };

    form.addEventListener('submit', (event) => salvarRegistro(event, estado));
    document.getElementById('cancelar-edicao').addEventListener('click', cancelarEdicao);
    document.getElementById('atualizar-lista').addEventListener('click', () => {
      try {
        renderizarRegistros(estado);
        registrarAtividade(estado, 'Lista consultada', 'lista atualizada com sucesso');
      } catch (erro) {
        mostrarErroGenerico();
        console.error('Falha ao consultar as publicações.', erro);
      }
    });

    lista.addEventListener('click', (event) => tratarAcaoDaLista(event, estado));
    renderizarRegistros(estado);
    registrarAtividade(estado, 'Lista consultada', 'lista exibida com sucesso');
  } catch (erro) {
    mostrarErroGenerico();
    console.error('Falha ao iniciar o mural.', erro);
  }
}

function salvarRegistro(event, estado) {
  event.preventDefault();

  try {
    const formulario = event.currentTarget;
    const campos = {
      tipo: document.getElementById('tipo'),
      item: document.getElementById('item'),
      cidade: document.getElementById('cidade'),
      detalhes: document.getElementById('detalhes')
    };

    campos.tipo.setCustomValidity('');
    campos.item.setCustomValidity('');
    campos.cidade.setCustomValidity('');
    campos.detalhes.setCustomValidity('');

    const item = campos.item.value.trim();
    const cidade = campos.cidade.value.trim();
    const detalhes = campos.detalhes.value.trim();

    if (!['Oferta', 'Procura'].includes(campos.tipo.value)) {
      campos.tipo.setCustomValidity('Selecione uma opção válida.');
    }

    if (item.length < 2 || item.length > 60) {
      campos.item.setCustomValidity('Informe um texto entre 2 e 60 caracteres.');
    } else if (contemControleOuMarcacao(item)) {
      campos.item.setCustomValidity('Remova caracteres de controle ou marcação.');
    }

    if (cidade.length < 2 || cidade.length > 50) {
      campos.cidade.setCustomValidity('Informe um texto entre 2 e 50 caracteres.');
    } else if (contemControleOuMarcacao(cidade)) {
      campos.cidade.setCustomValidity('Remova caracteres de controle ou marcação.');
    }

    if (detalhes.length > 240) {
      campos.detalhes.setCustomValidity('Use até 240 caracteres.');
    } else if (contemControleOuMarcacao(detalhes)) {
      campos.detalhes.setCustomValidity('Remova caracteres de controle ou marcação.');
    }

    if (!formulario.checkValidity()) {
      formulario.reportValidity();
      mostrarMensagem('Revise os campos destacados antes de salvar.', 'erro');
      return;
    }

    const dados = {
      tipo: campos.tipo.value,
      item,
      cidade,
      detalhes
    };
    const idEmEdicao = document.getElementById('registro-id').value;

    if (idEmEdicao) {
      const indice = estado.registros.findIndex((registro) => registro.id === idEmEdicao);
      if (indice < 0) throw new Error('Registro em edição não encontrado.');

      estado.registros[indice] = { ...estado.registros[indice], ...dados };
      registrarAtividade(estado, 'Item editado', 'publicação atualizada com sucesso');
      mostrarMensagem('Publicação atualizada com sucesso.', 'sucesso');
    } else {
      estado.registros.unshift({
        id: String(estado.proximoId++),
        ...dados
      });
      registrarAtividade(estado, 'Item adicionado', 'publicação adicionada com sucesso');
      mostrarMensagem('Publicação adicionada ao mural.', 'sucesso');
    }

    formulario.reset();
    limparModoEdicao();
    renderizarRegistros(estado);
  } catch (erro) {
    mostrarErroGenerico();
    console.error('Falha ao salvar a publicação.', erro);
  }
}

function tratarAcaoDaLista(event, estado) {
  const botao = event.target.closest('button[data-acao]');
  if (!botao) return;

  try {
    const registro = estado.registros.find((item) => item.id === botao.dataset.id);
    if (!registro) throw new Error('Publicação não encontrada.');

    if (botao.dataset.acao === 'editar') {
      preencherFormularioParaEdicao(registro);
      registrarAtividade(estado, 'Edição iniciada', 'publicação carregada no formulário');
      document.getElementById('form-mural').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (botao.dataset.acao === 'remover') {
      if (!window.confirm('Deseja remover esta publicação do mural?')) return;

      estado.registros = estado.registros.filter((item) => item.id !== registro.id);
      registrarAtividade(estado, 'Item removido', 'publicação removida com sucesso');
      renderizarRegistros(estado);
      mostrarMensagem('Publicação removida do mural.', 'sucesso');
    }
  } catch (erro) {
    mostrarErroGenerico();
    console.error('Falha ao executar a ação da publicação.', erro);
  }
}

function preencherFormularioParaEdicao(registro) {
  document.getElementById('registro-id').value = registro.id;
  document.getElementById('tipo').value = registro.tipo;
  document.getElementById('item').value = registro.item;
  document.getElementById('cidade').value = registro.cidade;
  document.getElementById('detalhes').value = registro.detalhes;
  document.getElementById('form-titulo').textContent = 'Editar publicação';
  document.getElementById('salvar-registro').textContent = 'Salvar alterações';
  document.getElementById('cancelar-edicao').hidden = false;
  mostrarMensagem('Edite os campos e salve as alterações.', 'neutro');
}

function cancelarEdicao() {
  document.getElementById('form-mural').reset();
  limparModoEdicao();
  mostrarMensagem('Edição cancelada.', 'neutro');
}

function limparModoEdicao() {
  document.getElementById('registro-id').value = '';
  document.getElementById('form-titulo').textContent = 'Publicar no mural';
  document.getElementById('salvar-registro').textContent = 'Adicionar ao mural';
  document.getElementById('cancelar-edicao').hidden = true;
}

function renderizarRegistros(estado) {
  const lista = document.getElementById('lista-registros');
  const fragmento = document.createDocumentFragment();

  estado.registros.forEach((registro) => {
    const cartao = document.createElement('article');
    cartao.className = 'registro-card';

    const tipo = document.createElement('span');
    tipo.className = `registro-tipo ${registro.tipo === 'Oferta' ? 'tipo-oferta' : 'tipo-procura'}`;
    tipo.textContent = registro.tipo;

    const titulo = document.createElement('h4');
    titulo.textContent = registro.item;

    const regiao = document.createElement('p');
    regiao.className = 'registro-regiao';
    regiao.textContent = registro.cidade;

    const detalhes = document.createElement('p');
    detalhes.className = 'registro-detalhes';
    detalhes.textContent = registro.detalhes || 'Sem detalhes adicionais.';

    const acoes = document.createElement('div');
    acoes.className = 'registro-acoes';
    acoes.append(
      criarBotaoAcao('Editar', 'editar', registro.id),
      criarBotaoAcao('Remover', 'remover', registro.id)
    );

    cartao.append(tipo, titulo, regiao, detalhes, acoes);
    fragmento.append(cartao);
  });

  lista.replaceChildren(fragmento);
  document.getElementById('lista-vazia').hidden = estado.registros.length > 0;
  document.getElementById('contador-registros').textContent =
    `${estado.registros.length} ${estado.registros.length === 1 ? 'registro' : 'registros'}`;
}

function criarBotaoAcao(rotulo, acao, id) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'btn-acao';
  botao.dataset.acao = acao;
  botao.dataset.id = id;
  botao.textContent = rotulo;
  return botao;
}

function registrarAtividade(estado, acao, resultado) {
  const data = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date());

  estado.atividades.unshift({ data, acao, resultado });
  estado.atividades = estado.atividades.slice(0, 10);

  const lista = document.getElementById('lista-atividades');
  const fragmento = document.createDocumentFragment();

  estado.atividades.forEach((atividade) => {
    const linha = document.createElement('li');
    const texto = document.createElement('span');
    texto.textContent = `${atividade.data} — ${atividade.acao}: ${atividade.resultado}.`;
    linha.append(texto);
    fragmento.append(linha);
  });

  lista.replaceChildren(fragmento);
  document.getElementById('atividades-vazias').hidden = estado.atividades.length > 0;
}

function contemControleOuMarcacao(valor) {
  return /[<>]/.test(valor) || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(valor);
}

function mostrarMensagem(texto, tipo) {
  const mensagem = document.getElementById('mensagem-form');
  mensagem.textContent = texto;
  mensagem.className = `mensagem-form mensagem-${tipo}`;
}

function mostrarErroGenerico() {
  mostrarMensagem('Não foi possível carregar os dados. Tente novamente.', 'erro');
}
